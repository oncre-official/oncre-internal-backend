import { Body, Controller, Get, Param, Patch, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, ApiUnprocessableEntityResponse } from '@nestjs/swagger';

import { Roles } from '@on/decorators/roles.decorator';
import { ErrorResponse, JsonResponse } from '@on/handlers/responses';
import { requestFilter } from '@on/helpers/filter';
import { QueryDto } from '@on/utils/dto/query.dto';
import { ApiResponseDTO } from '@on/utils/dto/response.dto';
import { ResponseDTO } from '@on/utils/types';

import { JwtAuthGuard } from '../auth/guard/auth.guard';
import { RoleGuard } from '../auth/guard/role.guard';

import { Staff } from './model/staff.model';
import { StaffService } from './staff.service';

import type { Response, Request } from 'express';

@ApiTags('Staff')
@ApiUnprocessableEntityResponse({ description: 'Error occurred', type: ApiResponseDTO })
@Controller('api/v1/staffs')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get staffs',
    description: 'Allows users get staffs',
  })
  @ApiOkResponse({ description: 'Get staffs successful ', type: [Staff] })
  @UseGuards(JwtAuthGuard)
  @Get()
  async findStaff(@Query() query: QueryDto, @Res() res: Response, @Req() req: Request): Promise<ResponseDTO> {
    try {
      const { skip, limit } = query;

      const filter = requestFilter(query, { convertToRegex: false });

      const response = await this.staffService.find(filter, skip, limit);

      return JsonResponse(res, response);
    } catch (error) {
      return ErrorResponse(res, error, req);
    }
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get staff profile',
    description: 'Allows users get a single staff by id',
  })
  @ApiOkResponse({ description: 'Get staff successful', type: ApiResponseDTO })
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getStaff(@Param('id') id: string, @Res() res: Response, @Req() req: Request): Promise<ResponseDTO> {
    try {
      const response = await this.staffService.findById(id);

      return JsonResponse(res, response);
    } catch (error) {
      return ErrorResponse(res, error, req);
    }
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Deactivate staff',
    description: 'Allows an admin to deactivate a staff profile',
  })
  @ApiOkResponse({ description: 'Deactivate staff successful', type: ApiResponseDTO })
  @Roles('admin', 'super-admin')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Patch(':id/deactivate')
  async deactivateStaff(@Param('id') id: string, @Res() res: Response, @Req() req: Request): Promise<ResponseDTO> {
    try {
      const response = await this.staffService.deactivate(id);

      return JsonResponse(res, response);
    } catch (error) {
      return ErrorResponse(res, error, req);
    }
  }
}
