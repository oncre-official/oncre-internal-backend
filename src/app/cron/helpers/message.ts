import { Injectable } from '@nestjs/common';

import { CaseRepository } from '@on/app/case/repository/case.repository';
import { CustomerRepository } from '@on/app/customer/repository/customer.repository';
import { TermiiService } from '@on/services/termii/service';
import { SMSResultResponse } from '@on/services/termii/type';

@Injectable()
export class MessageHelperService {
  constructor(
    private readonly termii: TermiiService,
    private readonly customers: CustomerRepository,
    private readonly cases: CaseRepository,
  ) {}

  async sendRecoveryMessage(message: any): Promise<SMSResultResponse> {
    const [recoveryCase, customer] = await Promise.all([
      this.cases.findById(message.caseId),
      this.customers.findById(message.customerId),
    ]);

    if (!recoveryCase || !customer) throw new Error('Recovery case or customer not found');
    if (!customer.phone) throw new Error('Customer phone number is missing');

    const content = this.buildRecoveryMessage(recoveryCase, customer, message.day);

    return await this.termii.sendSMS(customer.phone, content);
  }

  /**
   * PRIVATE METHODS
   */

  private buildRecoveryMessage(recoveryCase: any, customer: any, day?: number): string {
    console.log(day, 'day');

    return `Hello ${customer.name}, this is a reminder regarding your outstanding repayment of ${recoveryCase.outstandingBalance}. Please make your payment as soon as possible.`;
  }
}
