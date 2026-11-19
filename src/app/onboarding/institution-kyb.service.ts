import { BadRequestException, ConflictException, Injectable, Logger } from '@nestjs/common';

import { Merchant } from '@on/app/merchant/model/merchant.model';
import { User } from '@on/app/user/model/user.model';
import { UserRepository } from '@on/app/user/repository/user.repository';
import { config } from '@on/config';
import { UserStatus } from '@on/enum';
import { KycService } from '@on/services/kyc/service';
import { IBusinessCheckResult, IKycBusiness } from '@on/services/kyc/type';

import { hashIdNumber, maskIdNumber, normalizeRegNumber, sameBusinessName } from './helpers';
import { MerchantKycRepository } from './repository/merchant-kyc.repository';
import { MerchantOnboardingRepository } from './repository/merchant-onboarding.repository';
import { KycStatus, KycType } from './types/kyc.interface';
import { OnboardingStep } from './types/onboarding.interface';

const DUPLICATE_KEY = 11000;

/** A passed CAC check, waiting for the institution to be created. `skipped` when KYB_VERIFY_CAC=false. */
export type IInstitutionKybCheck =
  | { skipped: false; regNumber: string; idNumberHash: string; business: IKycBusiness; result: IBusinessCheckResult }
  | { skipped: true };

/**
 * KYB for institutions, run by OnCRE staff when they create the institution.
 *   1. check()    before anything is saved: CAC lookup (QoreID) must pass, or nothing is created.
 *   2. complete() after the institution exists: saves the KYB record and finishes sign-up,
 *                 so the institution only has to log in (phone + SMS code).
 */
@Injectable()
export class InstitutionKybService {
  private readonly logger = new Logger(InstitutionKybService.name);

  constructor(
    private readonly kyc: MerchantKycRepository,
    private readonly onboarding: MerchantOnboardingRepository,
    private readonly user: UserRepository,
    private readonly kycProvider: KycService,
  ) {}

  /**
   * Throws a clear error when the business fails: not on CAC, not ACTIVE, a different name from
   * `legalName`, or already linked to another OnCRE account. With no `legalName`, the CAC name is used.
   */
  async check(details: { registrationNo?: string; legalName?: string } | undefined): Promise<IInstitutionKybCheck> {
    if (!details?.registrationNo) {
      throw new BadRequestException('institutionDetails.registrationNo is required for a financial institution.');
    }

    if (!config.kyc.verifyCac) {
      this.logger.warn(`CAC check SKIPPED for ${maskIdNumber(details.registrationNo)} (KYB_VERIFY_CAC=false)`);

      return { skipped: true };
    }

    const regNumber = normalizeRegNumber(details.registrationNo);
    const idNumberHash = hashIdNumber(KycType.KYB, regNumber);

    // Checked before calling QoreID, so a duplicate never costs a paid check.
    const usedElsewhere = await this.kyc.count({ type: KycType.KYB, idNumberHash, status: KycStatus.VERIFIED });
    if (usedElsewhere) {
      throw new ConflictException(`${details.registrationNo} is already linked to another OnCRE account.`);
    }

    const result = await this.kycProvider.verifyBusiness({ regNumber });

    if (!result.verified || !result.business) {
      this.logger.warn(`KYB failed for ${maskIdNumber(regNumber)}: ${result.failureReason}`);
      throw new BadRequestException(
        `${details.registrationNo} could not be verified on CAC: ${result.failureReason ?? 'unknown reason'}.`,
      );
    }

    if (details.legalName && !sameBusinessName(result.business.legalName, details.legalName)) {
      throw new BadRequestException(
        `CAC name "${result.business.legalName}" does not match legal name "${details.legalName}".`,
      );
    }

    return { skipped: false, regNumber, idNumberHash, business: result.business, result };
  }

  /**
   * Saves the KYB record, activates the user and marks sign-up finished.
   * With the check skipped, no KYB record is saved, but sign-up still finishes so login can be tested.
   */
  async complete(user: User, merchant: Merchant, check: IInstitutionKybCheck): Promise<void> {
    if (!check.skipped) await this.saveKybRecord(user, merchant, check);

    await this.user.updateById(user._id, { status: UserStatus.ACTIVE });
    await this.onboarding.findOneAndUpdate(
      { userId: user._id },
      {
        $set: {
          countryCode: user.countryCode,
          phone: user.phone,
          step: OnboardingStep.IDENTITY_VERIFIED,
          merchantId: merchant._id,
          completedAt: new Date(),
        },
      },
      { upsert: true },
    );
  }

  private async saveKybRecord(
    user: User,
    merchant: Merchant,
    check: Extract<IInstitutionKybCheck, { skipped: false }>,
  ): Promise<void> {
    try {
      await this.kyc.create({
        userId: user._id,
        merchantId: merchant._id,
        type: KycType.KYB,
        provider: check.result.provider,
        idNumberMasked: maskIdNumber(check.regNumber),
        idNumberHash: check.idNumberHash,
        providerReference: check.result.providerReference,
        status: KycStatus.VERIFIED,
        verifiedBusiness: check.business,
        verifiedAt: new Date(),
      });
    } catch (error: any) {
      if (error?.code === DUPLICATE_KEY) {
        throw new ConflictException('This business is already linked to another OnCRE account.');
      }
      throw error;
    }
  }
}
