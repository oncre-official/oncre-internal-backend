export interface IOTPRequest {
  api_key: string;
  message_type: string;
  to: string;
  from: string;
  channel: string;
  pin_attempts: number;
  pin_time_to_live: number;
  pin_length: number;
  pin_placeholder: string;
  message_text: string;
  pin_type: string;
}

export interface IMessageRequest {
  api_key: string;
  to: string;
  sms: string;
  from: string;
  type: string;
  channel: string;
}

export interface IPinVerification {
  api_key: string;
  pin_id: string;
  pin: string;
}

export interface IOTPpin {
  pin: string;
  pinId: string;
}

export interface OTPResponse {
  pinId: string;
  to: string;
  smsStatus: string;
}

export interface MessageResponse {
  message_id: string;
  message: string;
  balance: number;
  user: string;
}

export interface OTPVerificationResponse {
  pinId: string;
  verified: string;
  msisdn: string;
}

export interface SMSResult {
  success: boolean;
  message_id: string | null;
  error: string | null;
  raw_response?: any;
}

export interface TermiiSendResponse {
  code: string;
  message_id: string;
  message: string;
  balance: number;
  user: string;
}

export interface TermiiError {
  message: string;
  code?: string;
}
