import { Body, Controller, Get, Patch, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, ApiUnprocessableEntityResponse } from '@nestjs/swagger';

import { User } from '@on/decorators/user.decorator';
import { ErrorResponse, JsonResponse } from '@on/handlers/responses';
import { ApiResponseDTO } from '@on/utils/dto/response.dto';
import { ResponseDTO } from '@on/utils/types';

import { JwtAuthGuard } from '../auth/guard/auth.guard';

import { ChangePasswordDto } from './dto/pin.dto';
import { UserDto } from './dto/user.dto';
import { UserService } from './user.service';

import type { UserDocument } from '../user/model/user.model';
import type { Response, Request } from 'express';

@ApiTags('User')
@ApiUnprocessableEntityResponse({
  description: 'Error occurred',
  type: ApiResponseDTO,
})
@Controller('api/v1/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user profile',
    description: 'Allows user get their profile',
  })
  @ApiOkResponse({ description: 'Get user profile', type: [User] })
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async findProfile(@User() user: UserDocument, @Res() res: Response, @Req() req: Request): Promise<ResponseDTO> {
    try {
      const response = await this.userService.profile(user);

      return JsonResponse(res, response);
    } catch (error) {
      return ErrorResponse(res, error, req);
    }
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update user profile',
    description: 'Allow user to update their profile',
  })
  @ApiOkResponse({
    description: 'Profile updated successfully',
    type: ApiResponseDTO,
  })
  @UseGuards(JwtAuthGuard)
  @Patch('/update')
  async update(
    @Body() payload: UserDto,
    @User() user: UserDocument,
    @Res() res: Response,
    @Req() req: Request,
  ): Promise<ResponseDTO> {
    try {
      const response = await this.userService.update(user, payload);

      return JsonResponse(res, response);
    } catch (error) {
      return ErrorResponse(res, error, req);
    }
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change Password', description: 'Allow user to change their Password' })
  @ApiOkResponse({ description: 'User password update successful', type: ApiResponseDTO })
  @UseGuards(JwtAuthGuard)
  @Patch('update-password')
  async updatePassword(
    @Body() payload: ChangePasswordDto,
    @User() user: UserDocument,
    @Res() res: Response,
    @Req() req: Request,
  ): Promise<ResponseDTO> {
    try {
      const response = await this.userService.updatePassword(user, payload);

      return JsonResponse(res, response);
    } catch (error) {
      return ErrorResponse(res, error, req);
    }
  }
}
