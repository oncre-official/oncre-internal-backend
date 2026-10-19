import { Body, Controller, Get, Param, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, ApiUnprocessableEntityResponse } from '@nestjs/swagger';

import { Roles } from '@on/decorators/roles.decorator';
import { User } from '@on/decorators/user.decorator';
import { ErrorResponse, JsonResponse } from '@on/handlers/responses';
import { requestFilter } from '@on/helpers/filter';
import { QueryDto } from '@on/utils/dto/query.dto';
import { ApiResponseDTO } from '@on/utils/dto/response.dto';
import { ResponseDTO } from '@on/utils/types';

import { JwtAuthGuard } from '../auth/guard/auth.guard';
import { RoleGuard } from '../auth/guard/role.guard';
import { User as UserDocument } from '../user/model/user.model';

import { CreateMerchantDto } from './dto/merchant.dto';
import { MerchantService } from './merchant.service';
import { Merchant } from './model/merchant.model';

import type { Response, Request } from 'express';

@ApiTags('Merchant')
@ApiUnprocessableEntityResponse({ description: 'Error occurred', type: ApiResponseDTO })
@Controller('api/v1/merchants')
export class MerchantController {
  constructor(private readonly merchantService: MerchantService) {}

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get merchants',
    description: 'Allows users get merchants',
  })
  @ApiOkResponse({ description: 'Get merchants successful ', type: [Merchant] })
  @UseGuards(JwtAuthGuard)
  @Get()
  async findMerchant(@Query() query: QueryDto, @Res() res: Response, @Req() req: Request): Promise<ResponseDTO> {
    try {
      const { skip, limit } = query;

      const filter = requestFilter(query, { convertToRegex: false });

      const response = await this.merchantService.find(filter, skip, limit);

      return JsonResponse(res, response);
    } catch (error) {
      return ErrorResponse(res, error, req);
    }
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create merchant',
    description: 'Allows users create merchant',
  })
  @ApiOkResponse({ description: 'Create merchant successful ', type: ApiResponseDTO })
  @Roles('admin', 'super-admin', 'sales', 'field-agent')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Post('/')
  async createMerchant(
    @Body() payload: CreateMerchantDto,
    @User() user: UserDocument,
    @Res() res: Response,
    @Req() req: Request,
  ): Promise<ResponseDTO> {
    try {
      const response = await this.merchantService.create(user, payload);

      return JsonResponse(res, response);
    } catch (error) {
      return ErrorResponse(res, error, req);
    }
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get merchant profile',
    description: 'Allows users get a single merchant by id',
  })
  @ApiOkResponse({ description: 'Get merchant successful', type: ApiResponseDTO })
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getMerchant(@Param('id') id: string, @Res() res: Response, @Req() req: Request): Promise<ResponseDTO> {
    try {
      const response = await this.merchantService.findById(id);

      return JsonResponse(res, response);
    } catch (error) {
      return ErrorResponse(res, error, req);
    }
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Deactivate merchant',
    description: 'Allows an admin to deactivate a merchant profile',
  })
  @ApiOkResponse({ description: 'Deactivate merchant successful', type: ApiResponseDTO })
  @Roles('admin', 'super-admin')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Patch(':id/deactivate')
  async deactivateMerchant(@Param('id') id: string, @Res() res: Response, @Req() req: Request): Promise<ResponseDTO> {
    try {
      const response = await this.merchantService.deactivate(id);

      return JsonResponse(res, response);
    } catch (error) {
      return ErrorResponse(res, error, req);
    }
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reject merchant',
    description: 'Allows an admin to reject a merchant created by sales/field-agent staff',
  })
  @ApiOkResponse({ description: 'Reject merchant successful', type: ApiResponseDTO })
  @Roles('admin', 'super-admin')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Patch(':id/reject')
  async rejectMerchant(@Param('id') id: string, @Res() res: Response, @Req() req: Request): Promise<ResponseDTO> {
    try {
      const response = await this.merchantService.reject(id);

      return JsonResponse(res, response);
    } catch (error) {
      return ErrorResponse(res, error, req);
    }
  }
}
