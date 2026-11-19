import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

import { config } from '@on/config';

import { IQoreIdNinVerificationPayload } from './type';

/** Shows only the last four digits, so logs never hold a full ID number. */
function maskIdNumber(idNumber: string): string {
  return `${'*'.repeat(Math.max(idNumber.length - 4, 0))}${idNumber.slice(-4)}`;
}

/**
 * QoreID's docs list the CAC check under three versions. They are tried in order; the next one is
 * used only when QoreID says the path does not exist (404), so a real answer is never re-requested.
 */
const CAC_PATHS = ['/v1/ng/identities/cac-premium', '/v2/ng/identities/cac-premium', '/v3/ng/identities/cac-premium'];

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
        `QoreID NIN verification failed for NIN: ${maskIdNumber(idNumber)}`,
        error instanceof Error ? error.stack : String(error),
      );

      throw new BadGatewayException(message);
    }
  }

  /**
   * Look up a Nigerian business on the CAC register (RC, BN or IT number) using QoreID.
   */
  async verifyCac(regNumber: string) {
    const accessToken = await this.getAccessToken();

    for (const [index, path] of CAC_PATHS.entries()) {
      try {
        const response = await this.axios.post(
          path,
          { regNumber },
          {
            headers: {
              accept: 'application/json',
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          },
        );

        if (index > 0) this.logger.warn(`QoreID CAC answered on ${path}; move it first in CAC_PATHS`);

        return response.data;
      } catch (error: any) {
        const isLastPath = index === CAC_PATHS.length - 1;
        if (error?.response?.status === 404 && !isLastPath) continue;

        const message = error?.response?.data?.message ?? 'Unable to verify business at this time';

        this.logger.error(
          `QoreID CAC verification failed on ${path} for: ${maskIdNumber(regNumber)}`,
          error instanceof Error ? error.stack : String(error),
        );

        throw new BadGatewayException(message);
      }
    }

    throw new BadGatewayException('Unable to verify business at this time');
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
