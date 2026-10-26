import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import * as XLSX from 'xlsx';

import { joinSearchQuery } from '@on/helpers/search';
import { TermiiService } from '@on/services/termii/service';
import { ServiceResponse } from '@on/utils/types';

import { Customer } from '../customer/model/customer.model';
import { CustomerRepository } from '../customer/repository/customer.repository';
import { LogService } from '../log/log.service';
import { AuditAction, AuditModule, AuditStatus } from '../log/type/audit-log.interface';
import { Merchant, MerchantDocument } from '../merchant/model/merchant.model';
import { MerchantRepository } from '../merchant/repository/merchant.repository';
import { MerchantType } from '../merchant/types/index.interface';
import { SharedService } from '../shared/shared.service';
import { StaffRepository } from '../staff/repository/staff.repository';
import { User } from '../user/model/user.model';

import { AssignCaseDto, BulkUploadDto, CreateCaseDto } from './dto/case.dto';
import { QueryCaseDto } from './dto/query.dto';
import { Case, CaseDocument } from './model/case.model';
import { CaseRepository } from './repository/case.repository';
import {
  CaseSource,
  CaseStatus,
  CaseUploadResult,
  ExcelCaseRow,
  RecoveryClassification,
} from './types/index.interface';

@Injectable()
export class CaseService {
  private readonly logger = new Logger(CaseService.name);

  constructor(
    private readonly log: LogService,
    private readonly cases: CaseRepository,
    private readonly termii: TermiiService,
    private readonly shared: SharedService,
    private readonly staff: StaffRepository,
    private readonly customer: CustomerRepository,
    private readonly merchant: MerchantRepository,
  ) {}

  async find(query: QueryCaseDto, skip: number = 0, limit: number = 20): Promise<ServiceResponse<any>> {
    const { search } = query;

    const joinQuery = joinSearchQuery({
      search,
      fields: ['zone', 'description', 'product', 'source'],
      query,
      joins: [
        {
          from: 'customers',
          localField: 'customerId',
          foreignField: '_id',
          as: 'customer',
          searchFields: ['name', 'businessName', 'key'],
        },
        {
          from: 'merchants',
          localField: 'merchantId',
          foreignField: '_id',
          as: 'merchant',
          searchFields: ['name', 'storeName', 'email', 'type', 'channel', 'location'],
        },
      ],
    });

    const strategies = {
      search: () => this.cases.aggregateAndCount(joinQuery, { aggregate: { skip, limit } }),
      normal: () =>
        this.cases.findAndCount(query, {
          aggregate: { skip, limit },
          populate: [{ path: 'merchant' }, { path: 'customer' }, { path: 'agent' }],
          sort: { createdAt: -1 },
        }),
    };

    const data = search ? await strategies.search() : await strategies.normal();

    return { data, message: 'cases successfully fetched' };
  }

  async create(creator: User, payload: CreateCaseDto): Promise<ServiceResponse<Case>> {
    const {
      merchantId,
      customerId,
      dueDate,
      merchantName,
      merchantPhone,
      customerPhone,
      customerName,
      classification,
    } = payload;

    if (dueDate && new Date(dueDate) > new Date()) throw new BadRequestException('Due date cannot be in the future');

    const creatorId = new ObjectId(String(creator._id));

    const type =
      String(classification) === String('financial_institution')
        ? MerchantType.FINANCIAL_INSTITUTION
        : MerchantType.STANDARD;

    const merchant: any = merchantId
      ? await this.merchant.findOne({ _id: merchantId })
      : await this.merchant.findOrCreate({ name: merchantName, phone: merchantPhone, createdBy: creatorId, type });

    if (merchantId && !merchant) throw new NotFoundException('Merchant not found');

    const customer: any = customerId
      ? await this.customer.findOne({ _id: customerId })
      : await this.customer.findOrCreate({
          name: customerName,
          phone: customerPhone,
          createdBy: creatorId,
          ...(payload.stateId && { stateId: payload.stateId }),
          ...(payload.lgaId && { lgaId: payload.lgaId }),
        });

    const caseQuery = {
      merchantId: merchant?._id,
      customerId: customer?._id,
      status: CaseStatus.NEW_IMPORTED,
    };

    const caseExist = await this.cases.findOne(caseQuery);
    if (caseExist) throw new BadRequestException('A recovery case already active for debtor and merchant');

    const caseId = await this.generateCaseId(merchant);

    const casePayload = {
      ...payload,
      caseId: caseId,
      merchantId: merchant?._id,
      customerId: customer?._id,
      debtAge: this.calculateDebtAge(dueDate),
    };

    const data = await this.cases.create(casePayload);

    await this.sendSms(merchant, customer, data);

    await this.log.record(creator, {
      action: AuditAction.CREATE,
      module: AuditModule.CASE,
      description: `Case ${caseId} created`,
      recordId: data?._id,
      recordType: 'case',
      recordReference: caseId,
      metadata: {
        source: data.source,
        merchantId: String(merchant?._id ?? ''),
        customerId: String(customer?._id ?? ''),
      },
    });

    return { data, message: `Case successfully created` };
  }

  async upload(creator: User, payload: BulkUploadDto): Promise<ServiceResponse<Case | any>> {
    const { file, merchantId } = payload;

    const workbook = XLSX.read(file.buffer, { type: 'buffer', cellDates: true });

    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) throw new BadRequestException('Excel workbook contains no worksheets');

    const worksheet = workbook.Sheets[firstSheetName];

    const rows = XLSX.utils.sheet_to_json<ExcelCaseRow>(worksheet, { defval: null, raw: false, blankrows: false });
    if (!rows.length) throw new BadRequestException('Excel file contains no data rows');

    const results: CaseUploadResult[] = [];

    for (const [index, row] of rows.entries()) {
      const excelRow = index + 2;
      const hasData = Object.values(row).some(
        (value) => value !== null && value !== undefined && String(value).trim() !== '',
      );

      if (!hasData) continue;

      const casePayload = this.mapExcelRowToCreateCaseDto(row);

      try {
        this.validateExcelCaseRow(row);

        const createdCase = await this.createCaseRecord(
          creator,
          { ...casePayload, merchantId },
          CaseSource.BULK_IMPORT,
        );

        results.push({
          row: excelRow,
          status: 'success',
          message: 'Case created successfully',
          caseId: String(createdCase?._id),
          data: {
            customerName: casePayload.customerName,
            customerPhone: casePayload.customerPhone,
            merchantName: casePayload.merchantName,
            merchantPhone: casePayload.merchantPhone,
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create case';

        results.push({
          row: excelRow,
          status: 'failed',
          message,
          errors: [message],
          data: casePayload ?? (row as Record<string, any>),
        });
      }
    }

    const successful = results.filter((result) => result.status === 'success');
    const failed = results.filter((result) => result.status === 'failed');

    await this.log.record(creator, {
      action: AuditAction.UPLOAD,
      module: AuditModule.CASE,
      description: 'Bulk case import completed',
      status:
        failed.length === 0 ? AuditStatus.SUCCESS : successful.length === 0 ? AuditStatus.FAILED : AuditStatus.PARTIAL,
      recordType: 'case_import',
      metadata: {
        fileName: file.originalname,
        total: results.length,
        successful,
        failed,
        results: results.map((result) => ({
          row: result.row,
          status: result.status,
          caseId: result.caseId,
          message: result.status === 'failed' ? result.message : undefined,
        })),
      },
    });

    return {
      message: 'Bulk case import completed',
      data: {
        total: results.length,
        successful: successful.length,
        failed: failed.length,
        successfulRows: successful,
        failedRows: failed,
      },
    };
  }

  async assign(payload: AssignCaseDto): Promise<ServiceResponse<Case[]>> {
    const { staffId, caseIds } = payload;

    const staff = await this.staff.findById(staffId);
    if (!staff) throw new NotFoundException('Staff member not found');

    const uniqueCaseIds = [...new Set(caseIds)];
    const cases = await Promise.all(uniqueCaseIds.map((caseId) => this.cases.findById(caseId)));

    const missingCaseIds = uniqueCaseIds.filter((_, index) => !cases[index]);
    if (missingCaseIds.length > 0)
      throw new NotFoundException(`The following cases were not found: ${missingCaseIds.join(', ')}`);

    await Promise.all(
      cases.map((existingCase) => existingCase.updateOne({ agentId: staffId, supervisorId: staff.supervisorId })),
    );

    const updatedCases = await Promise.all(uniqueCaseIds.map((caseId) => this.cases.findById(caseId)));

    return {
      message:
        uniqueCaseIds.length === 1
          ? 'Case assigned to staff member successfully'
          : `${uniqueCaseIds.length} cases assigned to staff member successfully`,
      data: updatedCases.filter(Boolean),
    };
  }

  /**
   * PRIVATE METHODS
   */

  private calculateDebtAge(dueDate: Date): number {
    const due = new Date(dueDate);

    const ageInMilliseconds = Date.now() - due.getTime();

    return Math.max(0, Math.floor(ageInMilliseconds / (1000 * 60 * 60 * 24)));
  }

  private validateExcelCaseRow(row: ExcelCaseRow): void {
    if (!row.customerName?.trim()) throw new BadRequestException('Customer name is required');
    if (!row.customerPhone?.trim()) throw new BadRequestException('Customer phone is required');

    if (
      row.outstandingBalance === null ||
      row.outstandingBalance === undefined ||
      String(row.outstandingBalance).trim() === ''
    )
      throw new BadRequestException('Outstanding balance is required');

    const outstandingBalance = Number(String(row.outstandingBalance).replace(/,/g, ''));

    if (!Number.isFinite(outstandingBalance) || outstandingBalance < 0) {
      throw new BadRequestException('Outstanding balance must be a valid non-negative number');
    }
  }

  private async createCaseRecord(creator: User, payload: any, source: CaseSource): Promise<CaseDocument> {
    const { merchantId, dueDate, merchantName, merchantPhone, customerName, customerPhone, classification } = payload;

    if (dueDate && new Date(dueDate) > new Date()) throw new BadRequestException('Due date cannot be in the future');

    let merchant: MerchantDocument;

    if (merchantId) {
      merchant = await this.merchant.findById(merchantId);
      if (!merchant) throw new NotFoundException('Merchant not found');
    } else {
      if (!merchantName || !merchantPhone)
        throw new BadRequestException('Merchant name and phone are required when merchant ID is not provided');

      merchant = await this.findOrCreateMatch(this.merchant, merchantName, merchantPhone, creator?._id, classification);
      if (!merchant) throw new NotFoundException('Merchant not found');
    }

    const customer = await this.findOrCreateMatch(this.customer, customerName, customerPhone, creator?._id);
    if (!customer) throw new NotFoundException('Customer not found');

    const caseQuery = {
      merchantId: merchant?._id,
      customerId: customer?._id,
      status: CaseStatus.NEW_IMPORTED,
    };

    const caseExist = await this.cases.findOne(caseQuery);
    if (caseExist) throw new BadRequestException('A recovery case already active for debtor and merchant');

    const caseId = await this.generateCaseId(merchant);

    const newClassification =
      merchant.type === MerchantType.FINANCIAL_INSTITUTION
        ? RecoveryClassification.FINANCIAL_INSTITUTION
        : RecoveryClassification.MERCHANT;

    const data = await this.cases.create({
      ...payload,
      caseId,
      classification: newClassification,
      merchantId: merchant?._id,
      customerId: customer?._id,
      debtAge: this.calculateDebtAge(dueDate),
      source,
    });

    await this.sendSms(merchant, customer, data);

    return data;
  }

  private mapExcelRowToCreateCaseDto(row: ExcelCaseRow) {
    const outstandingBalance = Number(this.sanitizeExcelValue(row.outstandingBalance).replace(/,/g, ''));

    return {
      ...row,
      customerName: this.sanitizeExcelValue(row.customerName),
      customerPhone: this.normalizePhone(row.customerPhone),
      outstandingBalance,
      amount: outstandingBalance,
      classification: this.sanitizeExcelValue(row.classification),
      product: this.sanitizeExcelValue(row.product),
      paymentAccount: this.sanitizeExcelValue(row.paymentAccount),
      comment: this.sanitizeExcelValue(row.comment),
      description: this.sanitizeExcelValue(row.description),
      merchantName: this.sanitizeExcelValue(row.merchantName),
      merchantPhone: this.normalizePhone(row.merchantPhone),
      dueDate: this.sanitizeExcelDate(row.dueDate),
    };
  }

  private sanitizeExcelValue(value: any): string {
    if (value === null || value === undefined) return '';

    let sanitized = String(value).trim();

    sanitized = sanitized.replace(/^'+/, '').trim();
    sanitized = sanitized.replace(/^["']+|["']+$/g, '').trim();

    return sanitized;
  }

  private normalizePhone(phone: unknown): string {
    return this.sanitizeExcelValue(phone).replace(/\D/g, '');
  }

  private async findOrCreateMatch(
    service: any,
    name: string,
    phone: string,
    creatorId: ObjectId,
    classification = RecoveryClassification.MERCHANT,
  ) {
    const candidates = this.getPhoneCandidates(phone);

    if (candidates.length) {
      const existing = await service.findOne({ phone: { $in: candidates } });
      if (existing) return existing;
    }

    const type =
      String(classification) === String('financial_institution')
        ? MerchantType.FINANCIAL_INSTITUTION
        : MerchantType.STANDARD;

    return service.findOrCreate({
      name,
      phone,
      createdBy: creatorId,
      type,
    });
  }

  private getPhoneCandidates(phone: unknown): string[] {
    const normalized = this.normalizePhone(phone);
    if (!normalized) return [];

    const candidates = new Set<string>([normalized]);

    let localNumber = normalized;

    if (localNumber.startsWith('234')) {
      localNumber = localNumber.slice(3);
    } else if (localNumber.startsWith('0')) {
      localNumber = localNumber.slice(1);
    }

    candidates.add(localNumber);
    candidates.add(`0${localNumber}`);
    candidates.add(`234${localNumber}`);

    return [...candidates].filter(Boolean);
  }

  private sanitizeExcelDate(value: unknown): string | undefined {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }

    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) throw new BadRequestException('Invalid due date');

      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    }

    const sanitized = this.sanitizeExcelValue(value);

    if (!sanitized) return undefined;
    if (/^\d{4}-\d{2}-\d{2}$/.test(sanitized)) {
      const [year, month, day] = sanitized.split('-').map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));

      if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
        throw new BadRequestException('Invalid due date');
      }

      return sanitized;
    }

    throw new BadRequestException('Due date must be a valid Excel date or YYYY-MM-DD');
  }

  private async generateCaseId(merchant: MerchantDocument): Promise<string> {
    const prefix = merchant.type === MerchantType.FINANCIAL_INSTITUTION ? 'CF' : 'CA';

    return this.shared.generateSequentialId('caseId', prefix, 5);
  }

  private async sendSms(merchant: Merchant, customer: Customer, newCase: CaseDocument): Promise<void> {
    const notifications: Promise<unknown>[] = [];

    const caseId = String(newCase.caseId);
    const amount = Number(newCase.amount ?? 0).toLocaleString('en-NG');
    const merchantName = merchant.name;
    const merchantPhone = merchant.phone;

    const merchantMessage = `Hello ${merchant.name},
Case #${caseId} is now active on OnCRE.
We've received your portfolio of ₦${amount}, and our recovery agents are already reaching out to your debtors.
We will update you on progress. Let's get you paid.- Team OnCRE`;

    const customerMessage = `Hello ${customer.name}, 
OnCRE has opened recovery Case ID ${caseId} for your overdue ${merchantName} balance of ₦${amount}.
Can you pay in full? If not, we can discuss a realistic instalment plan, starting with an amount you can afford
Call ${merchantPhone} or WhatsApp ${merchantPhone}. If any detail is wrong, contact us.`;

    if (merchant.type === MerchantType.STANDARD) {
      notifications.push(
        this.termii
          .sendSMS(merchant.phone, merchantMessage, { senderId: 'OnCRE', channel: 'generic' })
          .catch((error) => {
            this.logger.error(`Failed to send case creation SMS to merchant ${String(merchant._id)}: ${error.message}`);
          }),
      );
    }

    notifications.push(
      this.termii.sendSMS(customer.phone, customerMessage, { senderId: 'OnCRE', channel: 'generic' }).catch((error) => {
        this.logger.error(`Failed to send case creation SMS to customer ${String(customer._id)}: ${error.message}`);
      }),
    );

    await Promise.all(notifications);
  }
}
