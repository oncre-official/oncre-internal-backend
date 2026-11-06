import { Body, Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, ApiUnprocessableEntityResponse } from '@nestjs/swagger';

import { Roles } from '@on/decorators/roles.decorator';
import { ErrorResponse, JsonResponse } from '@on/handlers/responses';
import { requestFilter } from '@on/helpers/filter';
import { ApiResponseDTO } from '@on/utils/dto/response.dto';
import { ResponseDTO } from '@on/utils/types';

import { JwtAuthGuard } from '../auth/guard/auth.guard';
import { RoleGuard } from '../auth/guard/role.guard';

import { QueryTaskDto } from './dto/query.dto';
import { Task } from './model/task.model';
import { TaskService } from './task.service';

import type { Response, Request } from 'express';

@ApiTags('Task')
@ApiUnprocessableEntityResponse({ description: 'Error occurred', type: ApiResponseDTO })
@Controller('api/v1/tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get tasks',
    description: 'Allows users get tasks',
  })
  @ApiOkResponse({ description: 'Get tasks successful ', type: [Task] })
  @Roles('admin', 'super-admin', 'recovery-admin', 'recovery-officer')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Get()
  async findTask(@Query() query: QueryTaskDto, @Res() res: Response, @Req() req: Request): Promise<ResponseDTO> {
    try {
      const { skip, limit } = query;

      const filter = requestFilter(query, { convertToRegex: false });

      const response = await this.taskService.find(filter, skip, limit);

      return JsonResponse(res, response);
    } catch (error) {
      return ErrorResponse(res, error, req);
    }
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get Daily task queue',
    description: 'Allows users get daily task queues',
  })
  @ApiOkResponse({ description: 'Get task list successful ', type: [Task] })
  @Roles('admin', 'super-admin', 'recovery-admin', 'recovery-officer')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Get('queue')
  async findTaskList(@Query() query: QueryTaskDto, @Res() res: Response, @Req() req: Request): Promise<ResponseDTO> {
    try {
      const { skip, limit } = query;

      const filter = requestFilter(query, { convertToRegex: false });

      const response = await this.taskService.queue(filter, skip, limit);

      return JsonResponse(res, response);
    } catch (error) {
      return ErrorResponse(res, error, req);
    }
  }
}
