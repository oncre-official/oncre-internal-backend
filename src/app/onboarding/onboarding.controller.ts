import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, ApiUnprocessableEntityResponse } from '@nestjs/swagger';

import { User } from '@on/decorators/user.decorator';
import { ErrorResponse, JsonResponse } from '@on/handlers/responses';
import { ApiResponseDTO } from '@on/utils/dto/response.dto';
import { ResponseDTO } from '@on/utils/types';

import {
  MerchantLoginDto,
  MerchantSignupDto,
  VerifyMerchantLoginDto,
  VerifyMerchantPhoneDto,
  VerifyNinDto,
} from './dto/onboarding.dto';
import { OnboardingGuard } from './guard/onboarding.guard';
import { OnboardingService } from './onboarding.service';

import type { UserDocument } from '../user/model/user.model';
import type { Request, Response } from 'express';

@ApiTags('Merchant Onboarding')
@ApiUnprocessableEntityResponse({ description: 'Error occurred', type: ApiResponseDTO })
@Controller('auth/merchant')
export class MerchantSignupController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @ApiOperation({
    summary: 'Merchant sign-up',
    description: 'Start sign-up with a phone number. Sends an OTP by SMS. Also resumes an unfinished sign-up.',
  })
  @ApiOkResponse({ description: 'OTP sent', type: ApiResponseDTO })
  @Post('signup')
  async signup(@Body() payload: MerchantSignupDto, @Res() res: Response, @Req() req: Request): Promise<ResponseDTO> {
    try {
      const response = await this.onboardingService.signup(payload);

      return JsonResponse(res, response);
    } catch (error) {
      return ErrorResponse(res, error, req);
    }
  }

  @ApiOperation({
    summary: 'Resend sign-up OTP',
    description: 'Send a new OTP. Limited to one a minute, five an hour.',
  })
  @ApiOkResponse({ description: 'OTP sent', type: ApiResponseDTO })
  @Post('resend-otp')
  async resendOtp(@Body() payload: MerchantSignupDto, @Res() res: Response, @Req() req: Request): Promise<ResponseDTO> {
    try {
      const response = await this.onboardingService.signup(payload);

      return JsonResponse(res, response);
    } catch (error) {
      return ErrorResponse(res, error, req);
    }
  }

  @ApiOperation({
    summary: 'Verify merchant phone',
    description: 'Check the OTP. Returns an onboarding token and the next step (nin or kyb).',
  })
  @ApiOkResponse({ description: 'Phone verified', type: ApiResponseDTO })
  @Post('verify-phone')
  async verifyPhone(
    @Body() payload: VerifyMerchantPhoneDto,
    @Res() res: Response,
    @Req() req: Request,
  ): Promise<ResponseDTO> {
    try {
      const response = await this.onboardingService.verifyPhone(payload);

      return JsonResponse(res, response);
    } catch (error) {
      return ErrorResponse(res, error, req);
    }
  }

  @ApiOperation({
    summary: 'Merchant login',
    description: 'Send a login OTP to a merchant who has finished sign-up. Same limits as the sign-up OTP.',
  })
  @ApiOkResponse({ description: 'OTP sent', type: ApiResponseDTO })
  @Post('login')
  async login(@Body() payload: MerchantLoginDto, @Res() res: Response, @Req() req: Request): Promise<ResponseDTO> {
    try {
      const response = await this.onboardingService.login(payload);

      return JsonResponse(res, response);
    } catch (error) {
      return ErrorResponse(res, error, req);
    }
  }

  @ApiOperation({
    summary: 'Verify merchant login',
    description: 'Check the login OTP. Returns the login token and the merchant.',
  })
  @ApiOkResponse({ description: 'Logged in', type: ApiResponseDTO })
  @Post('login/verify')
  async verifyLogin(
    @Body() payload: VerifyMerchantLoginDto,
    @Res() res: Response,
    @Req() req: Request,
  ): Promise<ResponseDTO> {
    try {
      const response = await this.onboardingService.verifyLogin(payload);

      return JsonResponse(res, response);
    } catch (error) {
      return ErrorResponse(res, error, req);
    }
  }
}

@ApiTags('Merchant Onboarding')
@ApiUnprocessableEntityResponse({ description: 'Error occurred', type: ApiResponseDTO })
@Controller('merchant/kyc')
export class MerchantKycController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Verify NIN',
    description:
      'Standard merchants only. Verifies the NIN with QoreID and creates the merchant. Needs the onboarding token.',
  })
  @ApiOkResponse({ description: 'NIN verified, merchant created', type: ApiResponseDTO })
  @UseGuards(OnboardingGuard)
  @Post('nin')
  async verifyNin(
    @Body() payload: VerifyNinDto,
    @User() user: UserDocument,
    @Res() res: Response,
    @Req() req: Request,
  ): Promise<ResponseDTO> {
    try {
      const response = await this.onboardingService.verifyNin(user, payload);

      return JsonResponse(res, response);
    } catch (error) {
      return ErrorResponse(res, error, req);
    }
  }
}
