import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, ApiUnprocessableEntityResponse } from '@nestjs/swagger';

import { Roles } from '@on/decorators/roles.decorator';
import { ErrorResponse, JsonResponse } from '@on/handlers/responses';
import { requestFilter } from '@on/helpers/filter';
import { QueryDto } from '@on/utils/dto/query.dto';
import { ApiResponseDTO } from '@on/utils/dto/response.dto';
import { ResponseDTO } from '@on/utils/types';

import { JwtAuthGuard } from '../auth/guard/auth.guard';
import { RoleGuard } from '../auth/guard/role.guard';

import { LogService } from './log.service';
import { Log } from './model/log.model';

import type { Response, Request } from 'express';

@ApiTags('Log')
@ApiUnprocessableEntityResponse({ description: 'Error occurred', type: ApiResponseDTO })
@Controller('api/v1/logs')
export class LogController {
  constructor(private readonly logService: LogService) {}

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Admin gets audit logs',
    description: 'Allows admin get all audit logs',
  })
  @ApiOkResponse({ description: 'Get logs successful ', type: [Log] })
  @Roles('admin', 'super-admin')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Get('audit')
  async findLog(@Query() query: QueryDto, @Res() res: Response, @Req() req: Request): Promise<ResponseDTO> {
    try {
      const { skip, limit } = query;

      const filter = requestFilter(query, { convertToRegex: false });

      const response = await this.logService.findAudit(filter, skip, limit);

      return JsonResponse(res, response);
    } catch (error) {
      return ErrorResponse(res, error, req);
    }
  }
}
