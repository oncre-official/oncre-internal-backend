import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

import { LogService } from '@on/app/log/log.service';
import { config } from '@on/config';

import { BaseService } from '../base';
import { ILogRequest } from '../paystack/type';

import { encrypt3DES } from './helper';
import {
  IInitializeCard,
  IInitializeDirectDebit,
  IInitializePayment,
  IInitializeTokenizedCharge,
  IInitializeTransaction,
  ITransfer,
  IVerifyBank,
} from './types';
import { ExternalRequestStatus } from '@on/app/log/type/log.interface';

const startedAt = Date.now();

@Injectable()
export class FlutterwaveService extends BaseService {
  private readonly logger = new Logger(FlutterwaveService.name);

  private readonly axios: AxiosInstance;
  private readonly baseUrl = 'https://api.flutterwave.com/v3';
  private readonly secretKey = config.flutterwave.secretKey;
  private readonly appUrl = config.app.webBaseUrl;

  constructor(private readonly log: LogService) {
    super();

    if (!this.secretKey) this.logger.error('FLUTTERWAVE_SECRET_KEY is not configured');

    this.axios = axios.create({
      baseURL: this.baseUrl,
      headers: this.getHeaders(),
      timeout: 15000,
    });
  }

  async initiateCard(payload: IInitializeCard) {
    const { userId, customerId, amount, email, tx_ref, callback_url, metadata, ...others } = payload;

    const body = {
      ...others,
      amount,
      currency: 'NGN',
      tx_ref,
      redirect_url: callback_url || this.appUrl,
      customer: {
        email,
        ...(payload.firstName && { name: `${payload.firstName} ${payload.lastName || ''}`.trim() }),
      },
      payment_options: 'card',
      meta: metadata,
    };

    return this.initializePayment({ userId, customerId, body, logName: 'FLUTTERWAVE_CARD_INITIALIZE_PAYMENT' });
  }

  async initiateDirectDebit(payload: IInitializeDirectDebit) {
    const { userId, customerId, ...others } = payload;

    const url = '/accounts/tokenize';

    const body = {
      ...others,
      amount: 200,
      start_date: new Date(),
      end_date: new Date(new Date().setMonth(new Date().getMonth() + 11)),
    };

    try {
      const { data } = await this.axios.post(url, body);

      await this.logExternalRequest({
        userId,
        customerId,
        name: 'FLUTTERWAVE_DIRECT_DEBIT',
        method: 'POST',
        startedAt,
        url,
        request: body,
        response: data,
      });

      if (data?.status !== 'success') throw new BadRequestException(data?.message || 'Flutterwave direct debit failed');
      this.logger.log(`[Flutterwave] Direct debit initiated → ${String(userId)}`);

      return data.data;
    } catch (error: any) {
      await this.logExternalRequest({
        userId,
        customerId,
        name: 'FLUTTERWAVE_DIRECT_DEBIT',
        method: 'POST',
        startedAt,
        url,
        request: body,
        response: error?.response?.data,
        statusCode: error?.response?.status,
        error,
      });

      this.logger.error(`[Flutterwave] Direct charge error: ${error?.message}`);

      if (error instanceof BadRequestException) throw error;

      throw new BadRequestException(
        error?.response?.data?.message || error?.message || 'Flutterwave direct debit failed',
      );
    }
  }

  async initiatePayment(payload: IInitializePayment) {
    const { userId, customerId, amount, email, tx_ref, callback_url, firstName, lastName, metadata, ...others } =
      payload;

    const body = {
      ...others,
      amount,
      currency: 'NGN',
      tx_ref,
      redirect_url: callback_url || this.appUrl,
      customer: {
        email,
        ...(firstName || lastName ? { name: `${firstName || ''} ${lastName || ''}`.trim() } : {}),
      },
      meta: metadata,
    };

    return this.initializePayment({
      userId,
      customerId,
      body,
      logName: 'FLUTTERWAVE_INITIALIZE_PAYMENT',
      successResponse: (data) => ({
        paymentUrl: data?.link,
        reference: data?.tx_ref,
        flutterwaveReference: data?.flw_ref,
        transactionId: data?.id,
      }),
    });
  }

  async chargeCard(payload: IInitializeCard) {
    const { userId, customerId, amount, tx_ref, email, card_number, cvv, expiry_month, expiry_year, ...others } =
      payload;

    const url = '/charges?type=card';

    const body = {
      amount,
      currency: 'NGN',
      tx_ref,
      email,
      card_number,
      cvv,
      expiry_month,
      expiry_year,
      ...others,
    };

    const encryptedPayload = encrypt3DES(body);

    const startedAt = Date.now();

    this.logger.log(`[Flutterwave] Charging card → ${tx_ref}`);

    try {
      const { data } = await this.axios.post(url, encryptedPayload);

      await this.logExternalRequest({
        userId,
        customerId,
        name: 'FLUTTERWAVE_CARD_CHARGE',
        method: 'POST',
        startedAt,
        url,
        request: body,
        response: data,
      });

      if (data?.status !== 'success') throw new BadRequestException(data?.message || 'Flutterwave card charge failed');
      this.logger.log(`[Flutterwave] Card charge initiated → ${tx_ref}`);

      return data.data;
    } catch (error: any) {
      await this.logExternalRequest({
        userId,
        customerId,
        name: 'FLUTTERWAVE_CARD_CHARGE',
        method: 'POST',
        startedAt,
        url,
        request: body,
        response: error?.response?.data,
        statusCode: error?.response?.status,
        error,
      });

      this.logger.error(`[Flutterwave] Card charge error: ${error?.message}`);

      if (error instanceof BadRequestException) throw error;

      throw new BadRequestException(
        error?.response?.data?.message || error?.message || 'Flutterwave card charge failed',
      );
    }
  }

  async chargeAuthorization(payload: IInitializeTokenizedCharge) {
    const { userId, customerId, token, email, amount, tx_ref, ...others } = payload;

    const url = '/tokenized-charges';

    const body = {
      token,
      email,
      amount,
      currency: 'NGN',
      tx_ref,
      country: 'NG',
      redirect_url: payload.redirect_url || this.appUrl,
      ...others,
    };

    const startedAt = Date.now();

    this.logger.log(`[Flutterwave] Charging token → ${tx_ref}`);

    try {
      const { data } = await this.axios.post(url, body);

      await this.logExternalRequest({
        userId,
        customerId,
        name: 'FLUTTERWAVE_TOKENIZED_CHARGE',
        method: 'POST',
        startedAt,
        url,
        request: body,
        response: data,
      });

      if (data?.status !== 'success') {
        throw new BadRequestException(data?.message || 'Flutterwave tokenized charge failed');
      }

      this.logger.log(`[Flutterwave] Tokenized charge successful → ${tx_ref}`);

      return data.data;
    } catch (error: any) {
      await this.logExternalRequest({
        userId,
        customerId,
        name: 'FLUTTERWAVE_TOKENIZED_CHARGE',
        method: 'POST',
        startedAt,
        url,
        request: body,
        response: error?.response?.data,
        statusCode: error?.response?.status,
        error,
      });

      this.logger.error(`[Flutterwave] Tokenized charge error: ${error?.message}`);
      if (error instanceof BadRequestException) throw error;

      throw new BadRequestException(
        error?.response?.data?.message || error?.message || 'Flutterwave tokenized charge failed',
      );
    }
  }

  async verifyPayment(txRef: string) {
    if (!txRef) throw new BadRequestException('Transaction reference is required');

    try {
      this.logger.log(`[Flutterwave] Verifying payment by reference → ${txRef}`);

      const { data } = await this.axios.get('/transactions/verify_by_reference', { params: { tx_ref: txRef } });

      if (data?.status !== 'success')
        throw new BadRequestException(data?.message || 'Flutterwave reference verification failed');

      return {
        reference: data.data.reference,
        amount: data.data.amount,
        paidAt: data.data.paid_at,
        channel: data.data.channel,
        status: data.data.status,
        metadata: data.data.metadata,
      };
    } catch (error: any) {
      this.logger.error(`[Flutterwave] verifyPaymentByReference error: ${error?.message}`);

      throw new BadRequestException(
        error?.response?.data?.message || error?.message || 'Flutterwave reference verification failed',
      );
    }
  }

  async getBanks(country = 'NG') {
    try {
      this.logger.log(`[Flutterwave] Fetching banks → ${country}`);

      const { data } = await this.axios.get(`/banks/${country}`);

      if (data?.status !== 'success') {
        throw new BadRequestException(data?.message || 'Unable to fetch banks');
      }

      return data.data;
    } catch (error: any) {
      this.logger.error(`[Flutterwave] getBanks error: ${error?.message}`);

      throw new BadRequestException(error?.response?.data?.message || error?.message || 'Unable to fetch banks');
    }
  }

  async verifyBank(query: IVerifyBank) {
    const { account_number, account_bank } = query;

    try {
      this.logger.log(`[Flutterwave] Verifying bank account → ${account_number}`);

      const url = '/accounts/resolve';

      const body = {
        account_number,
        account_bank,
      };

      const { data } = await this.axios.post(url, body);

      if (data?.status !== 'success') throw new BadRequestException(data?.message || 'Unable to verify bank account');

      return data.data;
    } catch (error: any) {
      this.logger.error(`[Flutterwave] verifyBank error: ${error?.message}`);

      throw new BadRequestException(
        error?.response?.data?.message || error?.message || 'Unable to verify bank account',
      );
    }
  }

  async initiateTransfer(payload: ITransfer) {
    const { userId, customerId, account_number, account_bank, amount, reason, reference, callback_url, metadata } =
      payload;

    const url = '/transfers';

    const body = {
      account_bank,
      account_number,
      amount,
      currency: 'NGN',
      reference,
      narration: reason,
      callback_url: callback_url || this.appUrl,
      debit_currency: 'NGN',
      ...(metadata && { meta: metadata }),
    };

    this.logger.log(`[Flutterwave] Initiating transfer → ${reference}`);

    try {
      const { data } = await this.axios.post(url, body);

      await this.logExternalRequest({
        userId,
        customerId,
        name: 'FLUTTERWAVE_TRANSFER',
        method: 'POST',
        startedAt,
        url,
        request: body,
        response: data,
      });

      if (data?.status !== 'success') {
        throw new BadRequestException(data?.message || 'Flutterwave transfer failed');
      }

      this.logger.log(`[Flutterwave] Transfer initiated → ${data.data?.reference}`);

      return {
        transferId: data.data?.id,
        transferCode: data.data?.id,
        reference: data.data?.reference,
        status: data?.status,
        amount: data.data?.amount,
        currency: data.data?.currency,
        fee: data.data?.fee,
        name: data?.data?.full_name,
      };
    } catch (error: any) {
      await this.logExternalRequest({
        userId,
        customerId,
        name: 'FLUTTERWAVE_TRANSFER',
        method: 'POST',
        startedAt,
        url,
        request: body,
        response: error?.response?.data,
        statusCode: error?.response?.status,
        error,
      });

      this.logger.error(`[Flutterwave] transfer error: ${error?.message}`);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(error?.response?.data?.message || error?.message || 'Flutterwave transfer failed');
    }
  }

  /**
   * ---------------------------------------------------------
   * PRIVATE METHODS
   * ---------------------------------------------------------
   */

  private async initializePayment(options: IInitializeTransaction) {
    const { userId, customerId, body, logName, successResponse } = options;

    const url = '/payments';
    const startedAt = Date.now();

    this.logger.log('[Flutterwave] Initializing payment...');

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

      if (data?.status !== 'success') {
        throw new BadRequestException(data?.message || 'Flutterwave payment initialization failed');
      }

      this.logger.log(`[Flutterwave] Payment initialized → ${data?.data?.tx_ref}`);

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

      this.logger.error(`[Flutterwave] ${logName} error: ${error?.message}`);

      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(error?.response?.data?.message || error?.message || 'Flutterwave request failed');
    }
  }

  private async logExternalRequest(payload: ILogRequest) {
    const { startedAt, request, response, error, statusCode, ...others } = payload;

    try {
      await this.log.logExternal({
        ...others,
        provider: 'FLUTTERWAVE',
        status: error ? ExternalRequestStatus.FAILED : ExternalRequestStatus.SUCCESS,
        statusCode,
        duration: Date.now() - startedAt,
        request: this.sanitizeData(request),
        response: this.sanitizeData(response),
        error: this.serializeError(error),
      });
    } catch (logError: any) {
      this.logger.error(`[Flutterwave] Failed to save external request log: ${logError?.message}`);
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
