import * as dotenv from 'dotenv';
dotenv.config();

const isProd = process.env.ENV === 'production';

const slackWebhook = isProd ? process.env.PROD_SLACK_API_HOOK_URL : process.env.DEV_SLACK_API_HOOK_URL;

export const config = {
  port: process.env.PORT || 3001,
  app: {
    baseUrl: process.env.BASE_URL || 'https://6ebe-102-89-22-248.ngrok-free.app',
    env: process.env.ENV || 'development',
    isProd,
    webBaseUrl: isProd ? 'https://onbuffah.com/app/repayment' : 'https://staging.onbuffah.com/app/repayment',
  },
  email: {
    defaultTo: process.env.EMAIL_DEFAULT_TO,
    defaultFrom: process.env.EMAIL_DEFAULT_FROM,
  },
  db: {
    url: process.env.MONGO_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
    saltOrRounds: Number(process.env.JWT_SALT),
  },
  redis: {
    host: 'localhost',
    port: 6379,
    url: 'redis://localhost:6379',
  },
  utilities: {},
  termii: {
    apiKey: process.env.TERMII_API_KEY,
    secretKey: process.env.TERMII_SECRET_KEY,
    senderId: process.env.TERMII_SENDER_ID || 'N-Alert',
  },
  paystack: {
    secretKey: process.env.PAYSTACK_SECRET_KEY || '',
  },
  flutterwave: {
    secretKey: process.env.FLUTTERWAVE_SECRET_KEY,
    encryptionKey: process.env.FLUTTERWAVE_ENCRYPTION_KEY,
    webhookSecret: process.env.FLUTTERWAVE_WEBHOOK_SECRET || 'oncre-app',
    callbackUrl:
      process.env.FLUTTERWAVE_CALLBACK_URL || 'https://staging-api.onbuffah.com/api/v1/payments/flutterwave/callback',
  },
  slack: {
    webhookUrl: slackWebhook,
    chatHookUrl: process.env.MSG_SLACK_API_HOOK_URL,
    requestHookUrl: process.env.TRADES_SLACK_API_HOOK_URL,
  },
  brevo: {
    apiKey: process.env.BREVO_API_KEY,
    sendEmail: process.env.BREVO_SENDER_EMAIL || 'noreply@oncre.com',
    replyEmail: process.env.BREVO_REPLY_EMAIL || 'info@oncre.com',
  },
  cloudinary: {
    appKey: process.env.CLOUDINARY_ACCOUNT_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiSecret: process.env.CLOUDINARY_SECRET_KEY,
  },
  qoreId: {
    clientId: process.env.QOREID_CLIENT_ID,
    secretKey: process.env.QOREID_SECRET_KEY,
  },
};
