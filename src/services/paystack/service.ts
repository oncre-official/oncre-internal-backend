import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

import { LogService } from '@on/app/log/log.service';
import { config } from '@on/config';

import { BaseService } from '../base';

import {
  IChargeAuthorization,
  ICreateTransferRecipient,
  IInitializeCard,
  IInitializeDirectDebit,
  IInitializePayment,
  IInitializeTransaction,
  ILogRequest,
  InitiateTransfer,
  ITransfer,
  IVerifyBank,
} from './type';
import { ExternalRequestStatus } from '@on/app/log/type/log.interface';

@Injectable()
export class PaystackService extends BaseService {
  private readonly logger = new Logger(PaystackService.name);

  private readonly axios: AxiosInstance;
  private readonly baseUrl = 'https://api.paystack.co';
  private readonly secretKey = config.paystack.secretKey;
  private readonly appUrl = config.app.webBaseUrl;

  constructor(private readonly log: LogService) {
    super();

    if (!this.secretKey) this.logger.error('PAYSTACK_SECRET_KEY is not configured');

    this.axios = axios.create({
      baseURL: this.baseUrl,
      headers: this.getHeaders(),
      timeout: 15000,
    });
  }

  /**
   * Initialize card payment
   */
  async initiateCard(payload: IInitializeCard) {
    const { userId, customerId, ...others } = payload;

    const body = {
      ...others,
      amount: 10 * 100,
      channels: ['card'],
      callback_url: payload.callback_url || `${this.appUrl}`,
    };

    return this.initializeTransaction({
      userId,
      customerId,
      body,
      logName: 'PAYSTACK_CARD_INITIALIZE_PAYMENT',
    });
  }

  /**
   * Initialize direct debit payment
   */
  async initiateDirectDebit(payload: IInitializeDirectDebit) {
    const { userId, customerId, email, callback_url, account, address } = payload;

    const url = '/customer/authorization/initialize';
    const startedAt = Date.now();

    const body = {
      channel: 'direct_debit',
      email,
      callback_url: callback_url || `${this.appUrl}`,
      account: {
        number: account.number,
        bank_code: account.bank_code,
      },
      address: {
        state: address.state,
        city: address.city,
        street: address.street,
      },
    };

    this.logger.log(`[Paystack] Initializing direct debit authorization...`);

    try {
      const { data } = await this.axios.post(url, body);

      await this.logExternalRequest({
        userId,
        customerId,
        name: 'PAYSTACK_DIRECT_DEBIT_INITIALIZE_AUTHORIZATION',
        method: 'POST',
        startedAt,
        url,
        request: body,
        response: data,
      });

      if (!data?.status) {
        throw new BadRequestException(data?.message || 'Paystack direct debit initialization failed');
      }

      this.logger.log(`[Paystack] Direct debit authorization initialized → ${data?.data?.reference}`);

      return data.data;
    } catch (error: any) {
      await this.logExternalRequest({
        userId,
        customerId,
        name: 'PAYSTACK_DIRECT_DEBIT_INITIALIZE_AUTHORIZATION',
        method: 'POST',
        startedAt,
        url,
        request: body,
        response: error?.response?.data,
        statusCode: error?.response?.status,
        error,
      });

      this.logger.error(`[Paystack] Direct debit initialization error: ${error?.message}`);

      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        error?.response?.data?.message || error?.message || 'Paystack direct debit initialization failed',
      );
    }
  }

  /**
   * Initialize normal payment
   */
  async initiatePayment(payload: IInitializePayment) {
    const { userId, customerId, ...others } = payload;

    const body = {
      ...others,
      callback_url: payload.callback_url || `${this.appUrl}`,
    };

    return this.initializeTransaction({
      userId,
      customerId,
      body,
      logName: 'PAYSTACK_INITIALIZE_PAYMENT',
      successResponse: (data) => ({
        paymentUrl: data.authorization_url,
        reference: data.reference,
      }),
    });
  }

  /**
   * Authorization Charge
   */
  async chargeAuthorization(payload: IChargeAuthorization) {
    const { userId, customerId, email, amount, authorization_code, reference } = payload;

    const url = '/transaction/charge_authorization';
    const startedAt = Date.now();

    const body = {
      email,
      amount,
      authorization_code,
      ...(reference && { reference }),
    };

    this.logger.log(`[Paystack] Charging authorization...`);

    try {
      const { data } = await this.axios.post(url, body);

      await this.logExternalRequest({
        userId,
        customerId,
        name: 'PAYSTACK_CHARGE_AUTHORIZATION',
        method: 'POST',
        startedAt,
        url,
        request: body,
        response: data,
      });

      if (!data?.status) {
        throw new BadRequestException(data?.message || 'Paystack authorization charge failed');
      }

      this.logger.log(`[Paystack] Authorization charge successful → ${data?.data?.reference}`);

      return data.data;
    } catch (error: any) {
      await this.logExternalRequest({
        userId,
        customerId,
        name: 'PAYSTACK_CHARGE_AUTHORIZATION',
        method: 'POST',
        startedAt,
        url,
        request: body,
        response: error?.response?.data,
        statusCode: error?.response?.status,
        error,
      });

      this.logger.error(`[Paystack] Charge authorization error: ${error?.message}`);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(
        error?.response?.data?.message || error?.message || 'Paystack authorization charge failed',
      );
    }
  }

  /**
   * Verify payment
   */
  async verifyPayment(reference: string) {
    if (!reference) throw new BadRequestException('Payment reference is required');

    try {
      this.logger.log(`[Paystack] Verifying payment → ${reference}`);

      const { data } = await this.axios.get(`/transaction/verify/${reference}`);
      if (!data?.status) throw new BadRequestException(data?.message || 'Paystack verification failed');
      if (data.data.status !== 'success') throw new BadRequestException(`Payment not successful: ${data.data.status}`);

      this.logger.log(`[Paystack] Payment verified → ${reference}`);

      return {
        reference: data.data.reference,
        amount: data.data.amount / 100,
        metadata: data.data.metadata,
        paidAt: data.data.paid_at,
        channel: data.data.channel,
        status: data.data.status,
      };
    } catch (error: any) {
      this.logger.error(`[Paystack] verifyPayment error: ${error.message}`);
      throw new BadRequestException(error?.response?.data?.message || error.message);
    }
  }

  /**
   * Banks Api
   */
  async getBanks() {
    try {
      this.logger.log('[Paystack] Fetching banks');

      const { data } = await this.axios.get('/bank?country=nigeria');
      if (!data?.status) throw new BadRequestException(data?.message || 'Unable to fetch banks');

      return data.data;
    } catch (error: any) {
      this.logger.error(`[Paystack] getBanks error: ${error.message}`);
      throw new BadRequestException(error?.response?.data?.message || error.message);
    }
  }

  async verifyBank(query: IVerifyBank) {
    const { account_number, bank_code } = query;

    try {
      this.logger.log('[Paystack] verifying banks');

      const { data } = await this.axios.get(`/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`);
      if (!data?.status) throw new BadRequestException(data?.message || 'Unable to verify bank details');

      return data.data;
    } catch (error: any) {
      this.logger.error(`[Paystack] verify bank error: ${error.message}`);
      throw new BadRequestException(error?.response?.data?.message || error.message);
    }
  }

  /**
   * Transfer Api
   */

  async initiateTransfer(payload: InitiateTransfer) {
    const { account_number, bank_code, amount, reason, reference, userId, customerId } = payload;

    const recipient = await this.createTransferRecipient({
      userId,
      customerId,
      account_number,
      bank_code,
    });

    return await this.transfer({
      userId,
      customerId,
      recipient: recipient.recipient_code,
      amount,
      reason,
      reference,
    });
  }

  async createTransferRecipient(payload: ICreateTransferRecipient) {
    const { userId, customerId } = payload;

    const url = '/transferrecipient';
    const startedAt = Date.now();

    const body = {
      type: 'nuban',
      account_number: payload.account_number,
      bank_code: payload.bank_code,
      name: payload.name,
      currency: payload.currency || 'NGN',
      description: payload.description || '',
      metadata: payload.metadata || {},
    };

    try {
      this.logger.log('[Paystack] Creating transfer recipient');

      const { data } = await this.axios.post(url, body);

      await this.logExternalRequest({
        userId,
        customerId,
        name: 'PAYSTACK_CREATE_TRANSFER_RECIPIENT',
        method: 'POST',
        startedAt,
        url,
        request: body,
        response: data,
      });

      if (!data?.status) throw new BadRequestException(data?.message || 'Unable to create transfer recipient');
      this.logger.log(`[Paystack] Transfer recipient created → ${data.data.recipient_code}`);

      return data.data;
    } catch (error: any) {
      await this.logExternalRequest({
        userId,
        customerId,
        name: 'PAYSTACK_CREATE_TRANSFER_RECIPIENT',
        method: 'POST',
        startedAt,
        url,
        request: body,
        response: error?.response?.data,
        statusCode: error?.response?.status,
        error,
      });

      this.logger.error(`[Paystack] createTransferRecipient error: ${error.message}`);
      throw new BadRequestException(error?.response?.data?.message || error.message);
    }
  }

  /**
   * Initiate transfer
   */
  async transfer(payload: ITransfer) {
    const { userId, customerId } = payload;

    this.logger.log(`[Paystack] Initiating transfer → ${payload.recipient}`);

    const url = '/transfer';
    const startedAt = Date.now();

    const body = {
      source: 'balance',
      amount: payload.amount * 100,
      recipient: payload.recipient,
      reason: payload.reason,
      reference: payload.reference,
      metadata: payload.metadata,
    };

    try {
      const { data } = await this.axios.post(url, body);

      await this.logExternalRequest({
        userId,
        customerId,
        name: 'PAYSTACK_TRANSFER',
        method: 'POST',
        startedAt,
        url,
        request: body,
        response: data,
      });

      if (!data?.status) throw new BadRequestException(data?.message || 'Transfer failed');
      this.logger.log(`[Paystack] Transfer initiated → ${data.data.reference}`);

      return {
        transferCode: data.data.transfer_code,
        reference: data.data.reference,
        status: data.data.status,
      };
    } catch (error: any) {
      await this.logExternalRequest({
        userId,
        customerId,
        name: 'PAYSTACK_TRANSFER',
        method: 'POST',
        startedAt,
        url,
        request: body,
        response: error?.response?.data,
        statusCode: error?.response?.status,
        error,
      });

      this.logger.error(`[Paystack] transfer error: ${error.message}`);
      throw new BadRequestException(error?.response?.data?.message || error.message);
    }
  }

  /**
   * PRIVATE METHODS
   */

  private async initializeTransaction(options: IInitializeTransaction) {
    const { userId, customerId, body, logName, successResponse } = options;

    const url = '/transaction/initialize';
    const startedAt = Date.now();

    this.logger.log('[Paystack] Initializing payment...');

    try {
      const { data } = await this.axios.post(url, body);

      await this.logExternalRequest({
        userId,
        customerId,
        name: logName,
        method: 'POST',
        startedAt,
        url,
        request: body,
        response: data,
      });

      if (!data?.status) {
        throw new BadRequestException(data?.message || 'Paystack initialization failed');
      }

      this.logger.log(`[Paystack] Init success → ${data.data.reference}`);

      return successResponse ? successResponse(data.data) : data.data;
    } catch (error: any) {
      await this.logExternalRequest({
        userId,
        customerId,
        name: logName,
        method: 'POST',
        startedAt,
        url,
        request: body,
        response: error?.response?.data,
        statusCode: error?.response?.status,
        error,
      });

      this.logger.error(`[Paystack] ${logName} error: ${error?.message}`);

      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(error?.response?.data?.message || error?.message || 'Paystack request failed');
    }
  }

  /**
   * Log external request
   */
  private async logExternalRequest(payload: ILogRequest) {
    const { startedAt, request, response, error, statusCode, ...others } = payload;

    try {
      await this.log.logExternal({
        ...others,
        provider: 'PAYSTACK',
        status: error ? ExternalRequestStatus.FAILED : ExternalRequestStatus.SUCCESS,
        statusCode,
        duration: Date.now() - startedAt,
        request: this.sanitizeData(request),
        response: this.sanitizeData(response),
        error: this.serializeError(error),
      });
    } catch (logError: any) {
      this.logger.error(`[Paystack] Failed to save external request log: ${logError.message}`);
    }
  }

  /**
   * Headers
   */
  private getHeaders() {
    return {
      Authorization: `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    };
  }
}
