export abstract class BaseService {
  protected sanitizeData(data: any): any {
    if (!data) return data;
    if (typeof data !== 'object') return data;

    const sensitiveFields = new Set([
      'authorization',
      'Authorization',
      'secretKey',
      'secret_key',
      'password',
      'pin',
      'otp',
      'cvv',
      'card_number',
      'cardNumber',
      'token',
      'access_token',
      'client_secret',
    ]);

    const sanitize = (value: any): any => {
      if (!value || typeof value !== 'object') return value;
      if (Array.isArray(value)) return value.map((item) => sanitize(item));

      const sanitized: Record<string, any> = {};

      for (const [key, val] of Object.entries(value)) {
        if (sensitiveFields.has(key)) {
          sanitized[key] = '[REDACTED]';
          continue;
        }

        sanitized[key] = sanitize(val);
      }

      return sanitized;
    };

    return sanitize(data);
  }

  protected serializeError(error: any): Record<string, any> | undefined {
    if (!error) return undefined;

    return {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack,
      status: error.response?.status,
      response: this.sanitizeData(error.response?.data),
    };
  }
}
