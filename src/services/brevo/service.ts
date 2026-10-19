import * as Brevo from '@getbrevo/brevo';
import { Injectable, BadRequestException } from '@nestjs/common';

import { config } from '@on/config';

@Injectable()
export class BrevoService {
  private apiInstance: Brevo.TransactionalEmailsApi;

  private apiKey = config.brevo.apiKey as string;
  private replyEmail = config.brevo.replyEmail;
  private senderEmail = config.brevo.sendEmail;

  constructor() {
    this.apiInstance = new Brevo.TransactionalEmailsApi();
    this.apiInstance.setApiKey(0, this.apiKey);
  }

  async sendMail(
    userEmail: string,
    subject: string,
    mailMessage: string,
    attachments?: Brevo.SendSmtpEmailAttachmentInner[],
  ): Promise<boolean> {
    try {
      await this.apiInstance.sendTransacEmail({
        sender: {
          name: 'OnCre',
          email: this.senderEmail,
        },
        to: [{ email: userEmail }],
        replyTo: { email: this.replyEmail },
        subject,
        htmlContent: mailMessage,
        attachment: attachments && attachments.length > 0 ? attachments : undefined,
      });

      console.log('Brevo message was sent------------->');
      return true;
    } catch (error) {
      console.error(error);

      throw new BadRequestException('Failed to send emails');
    }
  }
}
