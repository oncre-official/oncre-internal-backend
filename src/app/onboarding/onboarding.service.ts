import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { Merchant } from '@on/app/merchant/model/merchant.model';
import { MerchantRepository } from '@on/app/merchant/repository/merchant.repository';
import { MerchantChannel, MerchantStatus, MerchantType } from '@on/app/merchant/types/index.interface';
import { RoleRepository } from '@on/app/role/repository/role.repository';
import { SharedService } from '@on/app/shared/shared.service';
import { User } from '@on/app/user/model/user.model';
import { UserRepository } from '@on/app/user/repository/user.repository';
import { UserStatus } from '@on/enum';
import { KycService } from '@on/services/kyc/service';
import { ServiceResponse } from '@on/utils/types';

import {
  MerchantLoginDto,
  MerchantSignupDto,
  VerifyMerchantLoginDto,
  VerifyKybDto,
  VerifyMerchantPhoneDto,
  VerifyNinDto,
} from './dto/onboarding.dto';
import {
  assertNotLocked,
  hashIdNumber,
  INVALID_CODE,
  KYB_LOCK_HOURS,
  KYB_MAX_FAILED_ATTEMPTS,
  maskIdNumber,
  NIN_LOCK_HOURS,
  NIN_MAX_FAILED_ATTEMPTS,
  normalizeRegNumber,
  parseMerchantPhone,
  sameBusinessName,
} from './helpers';
import { MerchantKycDocument } from './model/merchant-kyc.model';
import { MerchantOnboardingDocument } from './model/merchant-onboarding.model';
import { OtpService } from './otp.service';
import { MerchantKycRepository } from './repository/merchant-kyc.repository';
import { MerchantOnboardingRepository } from './repository/merchant-onboarding.repository';
import { MerchantSessionService } from './session.service';
import { KycStatus, KycType } from './types/kyc.interface';
import {
  IMerchantLoginCodeSent,
  IMerchantLoginResult,
  ISignupResult,
  IVerifyPhoneResult,
  OnboardingNextStep,
  OnboardingStep,
} from './types/onboarding.interface';
import { OtpPurpose } from './types/otp.interface';

const DUPLICATE_KEY = 11000;
const BLOCKED_USER_STATUSES = [UserStatus.INACTIVE, UserStatus.SUSPENDED];
const BLOCKED_MERCHANT_STATUSES = [MerchantStatus.IN_ACTIVE, MerchantStatus.SUSPENDED];

interface ILoginAccount {
  user: User;
  progress: MerchantOnboardingDocument;
  merchant: Merchant;
}

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    private readonly onboarding: MerchantOnboardingRepository,
    private readonly kyc: MerchantKycRepository,
    private readonly user: UserRepository,
    private readonly role: RoleRepository,
    private readonly merchant: MerchantRepository,
    private readonly shared: SharedService,
    private readonly kycProvider: KycService,
    private readonly otp: OtpService,
    private readonly session: MerchantSessionService,
  ) {}

  /**
   * Step 1: phone number. Creates the user on first use, or resumes an unfinished sign-up
   * (including a merchant OnCRE staff created), then sends an OTP.
   */
  async signup(payload: MerchantSignupDto): Promise<ServiceResponse<ISignupResult>> {
    const { countryCode, phone } = parseMerchantPhone(payload.phone);

    const user = await this.findOrCreateMerchantUser(countryCode, phone);
    const progress = await this.findOrCreateOnboarding(user, countryCode, phone);

    if (progress.step === OnboardingStep.IDENTITY_VERIFIED) {
      throw new ConflictException('This phone number is already registered. Please log in.');
    }

    const expiresInSeconds = await this.otp.send(user, progress, OtpPurpose.SIGNUP);

    return {
      data: { nextStep: OnboardingNextStep.VERIFY_PHONE, expiresInSeconds },
      message: 'OTP sent to your phone number.',
    };
  }

  /** Step 2: OTP. Marks the phone verified and returns a short-lived onboarding token. */
  async verifyPhone(payload: VerifyMerchantPhoneDto): Promise<ServiceResponse<IVerifyPhoneResult>> {
    const { countryCode, phone } = parseMerchantPhone(payload.phone);

    const user = await this.user.findOne({ countryCode, phone });
    if (!user) throw new BadRequestException(INVALID_CODE);

    const progress = await this.onboarding.findOne({ userId: user._id });
    if (!progress) throw new BadRequestException(INVALID_CODE);

    await this.otp.consume(user, progress, payload.otp);
    await this.user.updateById(user._id, { phoneVerified: true });

    if (progress.step === OnboardingStep.PHONE_PENDING) {
      await this.onboarding.updateOne({ _id: progress._id }, { $set: { step: OnboardingStep.PHONE_VERIFIED } });
    }

    const nextStep = await this.nextStepAfterPhone(user);
    const onboardingToken = await this.session.issueOnboardingToken(user);

    return { data: { nextStep, onboardingToken }, message: 'Phone number verified.' };
  }

  /**
   * Step 3: NIN. Verifies it with QoreID, then creates the standard merchant with the name on the
   * NIN record. Safe to retry: a NIN already verified for this user is not sent to QoreID again.
   */
  async verifyNin(userDoc: User, payload: VerifyNinDto): Promise<ServiceResponse<any>> {
    const { progress, existingMerchant } = await this.findIdentityStep(userDoc);
    if (existingMerchant?.type === MerchantType.FINANCIAL_INSTITUTION) {
      throw new BadRequestException('Financial institutions are verified with KYB, not NIN.');
    }

    assertNotLocked(progress.ninLockedUntil, 'Too many failed NIN attempts.');

    const idNumberHash = hashIdNumber(KycType.NIN, payload.nin);

    const usedElsewhere = await this.kyc.count({
      type: KycType.NIN,
      idNumberHash,
      status: KycStatus.VERIFIED,
      userId: { $ne: userDoc._id },
    });
    if (usedElsewhere) throw new ConflictException('This NIN is already linked to another OnCRE account.');

    let record = await this.kyc.findOne({ userId: userDoc._id, type: KycType.NIN, status: KycStatus.VERIFIED });
    if (!record) record = await this.checkNinWithProvider(userDoc, progress, payload, idNumberHash);
    if (!record.verifiedName) throw new BadRequestException('Verified NIN has no name on record.');

    const merchant = existingMerchant ?? (await this.createStandardMerchant(userDoc, record.verifiedName.fullName));

    const data = await this.completeOnboarding(userDoc, progress, merchant, record, {
      $set: { ninFailedAttempts: 0 },
      $unset: { ninLockedUntil: 1 },
    });

    return { data, message: 'NIN verified. Your merchant account is ready.' };
  }

  /**
   * Step 3 for institutions: KYB. Only for institutions OnCRE staff created. The CAC number must be
   * the one staff saved, and QoreID must find the business ACTIVE with the same legal name.
   * Safe to retry: a business already verified for this user is not sent to QoreID again.
   */
  async verifyKyb(userDoc: User, payload: VerifyKybDto): Promise<ServiceResponse<any>> {
    const { progress, existingMerchant: merchant } = await this.findIdentityStep(userDoc);
    if (merchant?.type !== MerchantType.FINANCIAL_INSTITUTION) {
      throw new BadRequestException('Business verification is only for institutions set up by OnCRE.');
    }

    assertNotLocked(progress.kybLockedUntil, 'Too many failed business verification attempts.');

    const regNumber = normalizeRegNumber(payload.regNumber);
    const savedRegNumber = merchant.institutionDetails?.registrationNo;
    if (savedRegNumber && normalizeRegNumber(savedRegNumber) !== regNumber) {
      throw new BadRequestException('This registration number does not match the one on your OnCRE account.');
    }

    const idNumberHash = hashIdNumber(KycType.KYB, regNumber);

    const usedElsewhere = await this.kyc.count({
      type: KycType.KYB,
      idNumberHash,
      status: KycStatus.VERIFIED,
      userId: { $ne: userDoc._id },
    });
    if (usedElsewhere) throw new ConflictException('This business is already linked to another OnCRE account.');

    let record = await this.kyc.findOne({ userId: userDoc._id, type: KycType.KYB, status: KycStatus.VERIFIED });
    if (!record) record = await this.checkBusinessWithProvider(userDoc, progress, merchant, regNumber, idNumberHash);

    const data = await this.completeOnboarding(userDoc, progress, merchant, record, {
      $set: { kybFailedAttempts: 0 },
      $unset: { kybLockedUntil: 1 },
    });

    return { data, message: 'Business verified. Your merchant account is ready.' };
  }

  /**
   * Login step 1: phone number. Only merchants who finished sign-up can log in. The code uses the
   * same limits as sign-up.
   */
  async login(payload: MerchantLoginDto): Promise<ServiceResponse<IMerchantLoginCodeSent>> {
    const { user, progress } = await this.findLoginAccount(payload.phone);

    const expiresInSeconds = await this.otp.send(user, progress, OtpPurpose.LOGIN);

    return { data: { expiresInSeconds }, message: 'OTP sent to your phone number.' };
  }

  /** Login step 2: code. Returns the login token. */
  async verifyLogin(payload: VerifyMerchantLoginDto): Promise<ServiceResponse<IMerchantLoginResult>> {
    // Same generic error as a wrong code, so this step never reveals whether a number has an account.
    const { user, progress, merchant } = await this.findLoginAccount(payload.phone, INVALID_CODE);

    await this.otp.consume(user, progress, payload.otp);

    const token = await this.session.issueLoginToken(user);
    this.logger.log(`Merchant ${merchant.merchantId} logged in`);

    const data: IMerchantLoginResult = {
      token,
      user: { _id: user._id, countryCode: user.countryCode, phone: user.phone },
      merchant: { _id: merchant._id, merchantId: merchant.merchantId, name: merchant.name, type: merchant.type },
    };

    return { data, message: 'Login successful.' };
  }

  /**
   * PRIVATE METHODS
   */

  /** The login rules: a merchant user who finished sign-up and is not blocked. */
  private async findLoginAccount(
    rawPhone: string,
    notFoundMessage = 'No merchant account uses this phone number. Please sign up.',
  ): Promise<ILoginAccount> {
    const { countryCode, phone } = parseMerchantPhone(rawPhone);

    const role = await this.role.findOne({ name: 'merchant' });
    const user = await this.user.findOne({ countryCode, phone });
    if (!user || !role || String(user.roleId) !== String(role._id)) throw new NotFoundException(notFoundMessage);

    const progress = await this.onboarding.findOne({ userId: user._id });
    const merchant = await this.merchant.findOne({ userId: user._id });
    if (!progress || !merchant) throw new NotFoundException(notFoundMessage);

    if (progress.step !== OnboardingStep.IDENTITY_VERIFIED) {
      throw new ForbiddenException('Please finish signing up before you log in.');
    }

    if (BLOCKED_USER_STATUSES.includes(user.status) || BLOCKED_MERCHANT_STATUSES.includes(merchant.status)) {
      throw new ForbiddenException('Your account is not active. Please contact OnCRE support.');
    }

    return { user, progress, merchant };
  }

  private async findOrCreateMerchantUser(countryCode: string, phone: string): Promise<User> {
    const role = await this.role.findOne({ name: 'merchant' });
    if (!role) throw new NotFoundException('Merchant role not found');

    const existing = await this.user.findOne({ countryCode, phone });
    if (existing) {
      if (String(existing.roleId) !== String(role._id)) {
        throw new ConflictException('This phone number is already registered. Please log in.');
      }

      return existing;
    }

    try {
      return await this.user.create({
        countryCode,
        phone,
        roleId: role._id,
        phoneVerified: false,
        status: UserStatus.PENDING,
      });
    } catch (error: any) {
      if (error?.code !== DUPLICATE_KEY) throw error;

      return await this.user.findOne({ countryCode, phone });
    }
  }

  private async findOrCreateOnboarding(
    user: User,
    countryCode: string,
    phone: string,
  ): Promise<MerchantOnboardingDocument> {
    // A merchant OnCRE staff created already exists, so link it from the start.
    const existingMerchant = await this.merchant.findOne({ userId: user._id });

    let progress: MerchantOnboardingDocument | null;
    try {
      progress = await this.onboarding.findOneAndUpdate(
        { userId: user._id },
        {
          $setOnInsert: { userId: user._id, countryCode, phone, step: OnboardingStep.PHONE_PENDING },
          ...(existingMerchant ? { $set: { merchantId: existingMerchant._id } } : {}),
        },
        { upsert: true },
      );
    } catch (error: any) {
      if (error?.code !== DUPLICATE_KEY) throw error;

      progress = await this.onboarding.findOne({ userId: user._id });
    }

    if (!progress) throw new NotFoundException('Unable to start sign-up. Please try again.');

    return progress;
  }

  private async nextStepAfterPhone(user: User): Promise<OnboardingNextStep> {
    const merchant = await this.merchant.findOne({ userId: user._id });

    return merchant?.type === MerchantType.FINANCIAL_INSTITUTION ? OnboardingNextStep.KYB : OnboardingNextStep.NIN;
  }

  /** Shared checks for step 3 (NIN or KYB): phone verified, sign-up not finished yet. */
  private async findIdentityStep(
    user: User,
  ): Promise<{ progress: MerchantOnboardingDocument; existingMerchant: Merchant | null }> {
    const progress = await this.onboarding.findOne({ userId: user._id });
    if (!progress || progress.step === OnboardingStep.PHONE_PENDING) {
      throw new ForbiddenException('Verify your phone number first.');
    }

    if (progress.step === OnboardingStep.IDENTITY_VERIFIED) {
      throw new ConflictException('Your identity has already been verified.');
    }

    const existingMerchant = await this.merchant.findOne({ userId: user._id });

    return { progress, existingMerchant };
  }

  /** Last step for NIN and KYB: link the record, activate the user, finish sign-up, issue the login token. */
  private async completeOnboarding(
    user: User,
    progress: MerchantOnboardingDocument,
    merchant: Merchant,
    record: MerchantKycDocument,
    resetCounters: { $set: Record<string, number>; $unset: Record<string, 1> },
  ) {
    await this.kyc.updateOne({ _id: record._id }, { $set: { merchantId: merchant._id } });
    await this.user.updateById(user._id, { status: UserStatus.ACTIVE });
    await this.onboarding.updateOne(
      { _id: progress._id },
      {
        $set: {
          step: OnboardingStep.IDENTITY_VERIFIED,
          merchantId: merchant._id,
          completedAt: new Date(),
          ...resetCounters.$set,
        },
        $unset: resetCounters.$unset,
      },
    );

    const token = await this.session.issueLoginToken(user);

    return {
      nextStep: OnboardingNextStep.WALLET,
      token,
      merchant: { _id: merchant._id, merchantId: merchant.merchantId, name: merchant.name, type: merchant.type },
      kyc: {
        type: record.type,
        idNumberMasked: record.idNumberMasked,
        ...(record.verifiedName ? { verifiedName: record.verifiedName } : {}),
        ...(record.verifiedBusiness ? { verifiedBusiness: record.verifiedBusiness } : {}),
      },
    };
  }

  private async checkNinWithProvider(
    user: User,
    progress: MerchantOnboardingDocument,
    payload: VerifyNinDto,
    idNumberHash: string,
  ): Promise<MerchantKycDocument> {
    const result = await this.kycProvider.verifyNin({
      nin: payload.nin,
      firstName: payload.firstName,
      lastName: payload.lastName,
    });

    const base = {
      userId: user._id,
      type: KycType.NIN,
      provider: result.provider,
      idNumberMasked: maskIdNumber(payload.nin),
      idNumberHash,
      providerReference: result.providerReference,
    };

    if (!result.verified) {
      await this.kyc.create({ ...base, status: KycStatus.FAILED, failureReason: result.failureReason });

      const attempts = progress.ninFailedAttempts + 1;
      const locked = attempts >= NIN_MAX_FAILED_ATTEMPTS;
      await this.onboarding.updateOne(
        { _id: progress._id },
        {
          $set: locked
            ? { ninFailedAttempts: 0, ninLockedUntil: new Date(Date.now() + NIN_LOCK_HOURS * 60 * 60 * 1000) }
            : { ninFailedAttempts: attempts },
        },
      );

      this.logger.warn(`NIN check failed for user ${String(user._id)}: ${result.failureReason}`);
      throw new BadRequestException('We could not verify this NIN with the name provided.');
    }

    try {
      return await this.kyc.create({
        ...base,
        status: KycStatus.VERIFIED,
        verifiedName: result.name,
        verifiedAt: new Date(),
      });
    } catch (error: any) {
      if (error?.code === DUPLICATE_KEY) {
        throw new ConflictException('This NIN is already linked to another OnCRE account.');
      }
      throw error;
    }
  }

  private async checkBusinessWithProvider(
    user: User,
    progress: MerchantOnboardingDocument,
    merchant: Merchant,
    regNumber: string,
    idNumberHash: string,
  ): Promise<MerchantKycDocument> {
    const result = await this.kycProvider.verifyBusiness({ regNumber });

    // QoreID found the business, but it must be the same company staff set up.
    const savedName = merchant.institutionDetails?.legalName;
    if (result.verified && result.business && savedName && !sameBusinessName(result.business.legalName, savedName)) {
      result.verified = false;
      result.failureReason = `CAC name "${result.business.legalName}" does not match "${savedName}"`;
    }

    const base = {
      userId: user._id,
      merchantId: merchant._id,
      type: KycType.KYB,
      provider: result.provider,
      idNumberMasked: maskIdNumber(regNumber),
      idNumberHash,
      providerReference: result.providerReference,
    };

    if (!result.verified) {
      await this.kyc.create({ ...base, status: KycStatus.FAILED, failureReason: result.failureReason });

      const attempts = progress.kybFailedAttempts + 1;
      const locked = attempts >= KYB_MAX_FAILED_ATTEMPTS;
      await this.onboarding.updateOne(
        { _id: progress._id },
        {
          $set: locked
            ? { kybFailedAttempts: 0, kybLockedUntil: new Date(Date.now() + KYB_LOCK_HOURS * 60 * 60 * 1000) }
            : { kybFailedAttempts: attempts },
        },
      );

      this.logger.warn(`KYB check failed for user ${String(user._id)}: ${result.failureReason}`);
      throw new BadRequestException('We could not verify your business. Please check the registration number.');
    }

    try {
      return await this.kyc.create({
        ...base,
        status: KycStatus.VERIFIED,
        verifiedBusiness: result.business,
        verifiedAt: new Date(),
      });
    } catch (error: any) {
      if (error?.code === DUPLICATE_KEY) {
        throw new ConflictException('This business is already linked to another OnCRE account.');
      }
      throw error;
    }
  }

  private async createStandardMerchant(user: User, name: string): Promise<Merchant> {
    const merchantId = await this.shared.generateSequentialId('merchantId', 'MER', 5);

    return await this.merchant.create({
      userId: user._id,
      createdBy: user._id,
      merchantId,
      name,
      phone: user.phone,
      type: MerchantType.STANDARD,
      channel: MerchantChannel.MERCHANT_PORTAL,
      status: MerchantStatus.ACTIVE,
      activatedAt: new Date(),
    });
  }
}
