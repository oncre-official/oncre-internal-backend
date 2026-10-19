import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

import { config } from '@on/config';
import { toInternationalPhone } from '@on/helpers/phone';

import {
  IMessageRequest,
  IOTPRequest,
  IOTPpin,
  IPinVerification,
  MessageResponse,
  OTPResponse,
  SMSResult,
  TermiiError,
  TermiiSendResponse,
} from './type';

@Injectable()
export class TermiiService {
  private readonly logger = new Logger(TermiiService.name);

  private readonly axios: AxiosInstance;
  private readonly apiKey: string;
  private readonly senderId: string;
  private readonly baseUrl = 'https://v3.api.termii.com';

  constructor() {
    this.apiKey = config.termii.apiKey as string;
    this.senderId = config.termii.senderId || 'N-Alert';

    this.axios = axios.create({
      baseURL: this.baseUrl,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Send SMS via Termii
   */
  async sendSMS(
    phoneNumber: string,
    messageBody: string,
    options?: { senderId?: string; channel?: string },
  ): Promise<SMSResult> {
    const to = toInternationalPhone(phoneNumber);
    if (!this.apiKey) throw new BadRequestException('Termii API key not configured');

    if (!to || to.length < 12) throw new BadRequestException(`Invalid phone number: ${phoneNumber}`);

    const payload = {
      to,
      from: options?.senderId ?? this.senderId,
      sms: `${messageBody}\n\nPowered by OnCre`,
      type: 'plain',
      channel: options?.channel ?? 'dnd',
      api_key: this.apiKey,
    };

    try {
      this.logger.log(`[Termii] Sending SMS → ${to}`);

      const { data } = await this.axios.post('/api/sms/send', payload);

      this.logger.log(`This is the data from termii`, data);

      if (data?.code === 'ok') {
        const res = data as TermiiSendResponse;

        this.logger.log(`[Termii] Sent successfully → ${to} | ID: ${res.message_id}`);

        return {
          success: true,
          message_id: res.message_id,
          error: null,
          raw_response: data,
        };
      }

      const err = data as TermiiError;
      this.logger.error(`[Termii] Failed → ${to}: ${err?.message || 'Unknown error'}`);

      throw new BadRequestException(`Failed to send SMS: ${err?.message || 'Unknown error'}`);
    } catch (error: any) {
      this.logger.error(`[Termii] Network error → ${error.message}`);
      throw new BadRequestException(`Network error: ${error.message}`);
    }
  }

  async sendMessage(to: string, message: string): Promise<MessageResponse> {
    const payload: IMessageRequest = {
      api_key: this.apiKey,
      to,
      from: this.senderId,
      sms: message,
      type: 'plain',
      channel: 'dnd',
    };

    try {
      const { data } = await this.axios.post<MessageResponse>('/api/sms/send', payload);
      console.log(data);

      return data;
    } catch (error: any) {
      this.logger.error(error.message);
      throw new BadRequestException(error.message);
    }
  }

  async sendOTP(to: string): Promise<OTPResponse> {
    const payload: IOTPRequest = {
      api_key: this.apiKey,
      message_type: 'NUMERIC',
      to,
      from: this.senderId,
      channel: 'dnd',
      pin_attempts: 10,
      pin_time_to_live: 5,
      pin_length: 6,
      pin_placeholder: '< 1234 >',
      message_text: 'Your code is < 1234 >. Valid for 30 minutes, one-time use only.',
      pin_type: 'NUMERIC',
    };

    try {
      const { data } = await this.axios.post<OTPResponse>('/sms/otp/send', payload);

      return data;
    } catch (error: any) {
      this.logger.error(error.message);
      throw new BadRequestException(error.message);
    }
  }

  async verifyOTP(data: IOTPpin): Promise<any> {
    const payload: IPinVerification = {
      api_key: this.apiKey,
      pin_id: data.pinId,
      pin: data.pin,
    };

    try {
      const { data: response } = await this.axios.post('/sms/otp/verify', payload);

      return response;
    } catch (error: any) {
      this.logger.error(error.message);
      throw new BadRequestException(error.message);
    }
  }

  /**
   * DELIVERY STATUSs
   */

  async balance(): Promise<number | null> {
    if (!this.apiKey) return null;

    try {
      const { data } = await this.axios.get(`/api/get-balance?api_key=${this.apiKey}`);

      return data?.balance ?? null;
    } catch (error: any) {
      this.logger.error(`[Termii] Balance fetch failed: ${error.message}`);
      return null;
    }
  }

  async deliveryStatus(messageId: string): Promise<{ status: string; delivered: boolean } | null> {
    if (!this.apiKey || !messageId) return null;

    try {
      const { data } = await this.axios.get(`/api/sms/inbox?api_key=${this.apiKey}&message_id=${messageId}`);

      return {
        status: data?.status || 'unknown',
        delivered: data?.status === 'delivered',
      };
    } catch (error: any) {
      this.logger.error(`[Termii] Delivery status error: ${error.message}`);
      return null;
    }
  }
}
