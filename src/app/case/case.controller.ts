import { Body, Controller, Get, Param, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { FormDataRequest } from 'nestjs-form-data';

import { Roles } from '@on/decorators/roles.decorator';
import { User } from '@on/decorators/user.decorator';
import { ErrorResponse, JsonResponse } from '@on/handlers/responses';
import { requestFilter } from '@on/helpers/filter';
import { FileDto } from '@on/utils/dto/file.dto';
import { ApiResponseDTO } from '@on/utils/dto/response.dto';
import { ResponseDTO } from '@on/utils/types';

import { JwtAuthGuard } from '../auth/guard/auth.guard';
import { RoleGuard } from '../auth/guard/role.guard';
import { User as UserDocument } from '../user/model/user.model';

import { CaseService } from './case.service';
import { AssignCaseDto, CreateCaseDto } from './dto/case.dto';
import { QueryCaseDto } from './dto/query.dto';
import { Case } from './model/case.model';

import type { Response, Request } from 'express';

@ApiTags('Case')
@ApiUnprocessableEntityResponse({ description: 'Error occurred', type: ApiResponseDTO })
@Controller('api/v1/cases')
export class CaseController {
  constructor(private readonly caseService: CaseService) {}

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get cases',
    description: 'Allows users get cases',
  })
  @ApiOkResponse({ description: 'Get cases successful ', type: [Case] })
  @Roles('admin', 'super-admin',  'recovery-admin', 'recovery-officer', 'recovery-admin', 'recovery-officer')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Get()
  async findCase(@Query() query: QueryCaseDto, @Res() res: Response, @Req() req: Request): Promise<ResponseDTO> {
    try {
      const { skip, limit } = query;

      const filter = requestFilter(query, { convertToRegex: false });

      const response = await this.caseService.find(filter, skip, limit);

      return JsonResponse(res, response);
    } catch (error) {
      return ErrorResponse(res, error, req);
    }
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create case',
    description: 'Allows users create case',
  })
  @ApiOkResponse({ description: 'Create case successful ', type: ApiResponseDTO })
  @Roles('admin', 'super-admin', 'recovery-admin', 'recovery-officer')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Post('/')
  async createCase(
    @Body() payload: CreateCaseDto,
    @User() user: UserDocument,
    @Res() res: Response,
    @Req() req: Request,
  ): Promise<ResponseDTO> {
    try {
      const response = await this.caseService.create(user, payload);

      return JsonResponse(res, response);
    } catch (error) {
      return ErrorResponse(res, error, req);
    }
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Upload cases',
    description: 'Allows users upload new cases',
  })
  @ApiOkResponse({ description: 'Case uploaded successfully', type: ApiResponseDTO })
  @ApiConsumes('multipart/form-data')
  @Roles('admin', 'super-admin', 'recovery-admin', 'recovery-officer')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @FormDataRequest()
  @Post('/bulk')
  async uploadCase(
    @Body() payload: FileDto,
    @User() user: UserDocument,
    @Res() res: Response,
    @Req() req: Request,
  ): Promise<ResponseDTO> {
    try {
      const response = await this.caseService.upload(user, payload);

      return JsonResponse(res, response);
    } catch (error) {
      return ErrorResponse(res, error, req);
    }
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Assign case to an agent',
    description: 'Allows users to assign cases',
  })
  @ApiOkResponse({ description: 'Create case successful ', type: ApiResponseDTO })
  @Roles('admin', 'super-admin', 'recovery-admin', 'recovery-officer')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Post(':id/assign')
  async assign(
    @Body() payload: AssignCaseDto,
    @Param('id') id: string,
    @Res() res: Response,
    @Req() req: Request,
  ): Promise<ResponseDTO> {
    try {
      const response = await this.caseService.assign(id, payload);

      return JsonResponse(res, response);
    } catch (error) {
      return ErrorResponse(res, error, req);
    }
  }
}
