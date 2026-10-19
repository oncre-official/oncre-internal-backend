import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

import { config } from '@on/config';

import { IQoreIdNinVerificationPayload } from './type';

@Injectable()
export class QoreIdService {
  private readonly logger = new Logger(QoreIdService.name);

  private readonly axios: AxiosInstance;
  private readonly baseUrl = 'https://api.qoreid.com';

  private readonly clientId = config.qoreId.clientId;
  private readonly secretKey = config.qoreId.secretKey;
  private readonly appUrl = config.app.baseUrl;

  private accessToken?: string;
  private tokenExpiresAt?: number;

  constructor() {
    if (!this.clientId) this.logger.error('QOREID_CLIENT_ID is not configured');
    if (!this.secretKey) this.logger.error('QOREID_SECRET_KEY is not configured');

    this.axios = axios.create({
      baseURL: this.baseUrl,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Validate a Nigerian NIN using QoreID.
   */
  async verifyNin(idNumber: string, payload: IQoreIdNinVerificationPayload) {
    const accessToken = await this.getAccessToken();

    try {
      const response = await this.axios.post(`/v1/ng/identities/nin-premium/${idNumber}`, payload, {
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error: any) {
      const message = error?.response?.data?.message ?? 'Unable to verify NIN at this time';

      this.logger.error(
        `QoreID NIN verification failed for NIN: ${idNumber}`,
        error instanceof Error ? error.stack : String(error),
      );

      throw new BadGatewayException(message);
    }
  }

  /**
   * PRIVATE METHODS
   */
  /**
   * Get QoreID OAuth access token.
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    try {
      const response = await this.axios.post(
        '/token',
        { clientId: this.clientId, secret: this.secretKey },
        {
          headers: {
            accept: 'text/plain',
            'Content-Type': 'application/json',
          },
        },
      );

      const token = response.data?.accessToken ?? response.data?.access_token ?? response.data?.token;

      if (!token) {
        this.logger.error(`Invalid QoreID token response: ${JSON.stringify(response.data)}`);
        throw new BadGatewayException('Unable to authenticate with identity verification provider');
      }

      const expiresIn = response.data?.expiresIn ?? 3600;

      this.accessToken = token;
      this.tokenExpiresAt = Date.now() + expiresIn * 1000 - 60_000;

      return token;
    } catch (error) {
      this.logger.error('Failed to authenticate with QoreID', error instanceof Error ? error.stack : String(error));
      throw new BadGatewayException('Unable to authenticate with identity verification provider');
    }
  }
}
