import { Body, Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, ApiUnprocessableEntityResponse } from '@nestjs/swagger';

import { Roles } from '@on/decorators/roles.decorator';
import { ErrorResponse, JsonResponse } from '@on/handlers/responses';
import { requestFilter } from '@on/helpers/filter';
import { ApiResponseDTO } from '@on/utils/dto/response.dto';
import { ResponseDTO } from '@on/utils/types';

import { JwtAuthGuard } from '../auth/guard/auth.guard';
import { RoleGuard } from '../auth/guard/role.guard';

import { CallService } from './call.service';
import { QueryCallDto } from './dto/query.dto';
import { Call } from './model/call.model';

import type { Response, Request } from 'express';

@ApiTags('Call')
@ApiUnprocessableEntityResponse({ description: 'Error occurred', type: ApiResponseDTO })
@Controller('api/v1/calls')
export class CallController {
  constructor(private readonly callService: CallService) {}

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get calls',
    description: 'Allows users get calls',
  })
  @ApiOkResponse({ description: 'Get calls successful ', type: [Call] })
  @Roles('admin', 'super-admin', 'recovery-admin', 'recovery-officer')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Get()
  async findCall(@Query() query: QueryCallDto, @Res() res: Response, @Req() req: Request): Promise<ResponseDTO> {
    try {
      const { skip, limit } = query;

      const filter = requestFilter(query, { convertToRegex: false });

      const response = await this.callService.find(filter, skip, limit);

      return JsonResponse(res, response);
    } catch (error) {
      return ErrorResponse(res, error, req);
    }
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get Daily call queue',
    description: 'Allows users get daily call queues',
  })
  @ApiOkResponse({ description: 'Get call list successful ', type: [Call] })
  @Roles('admin', 'super-admin', 'recovery-admin', 'recovery-officer')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Get('queue')
  async findCallList(@Query() query: QueryCallDto, @Res() res: Response, @Req() req: Request): Promise<ResponseDTO> {
    try {
      const { skip, limit } = query;

      const filter = requestFilter(query, { convertToRegex: false });

      const response = await this.callService.queue(filter, skip, limit);

      return JsonResponse(res, response);
    } catch (error) {
      return ErrorResponse(res, error, req);
    }
  }
}
