import { Body, Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, ApiUnprocessableEntityResponse } from '@nestjs/swagger';

import { ErrorResponse, JsonResponse } from '@on/handlers/responses';
import { ApiResponseDTO } from '@on/utils/dto/response.dto';
import { ResponseDTO } from '@on/utils/types';

import { JwtAuthGuard } from '../auth/guard/auth.guard';

import { Role } from './model/role.model';
import { RoleService } from './role.service';

import type { Response, Request } from 'express';

@ApiTags('Role')
@ApiUnprocessableEntityResponse({
  description: 'Error occurred',
  type: ApiResponseDTO,
})
@Controller('api/v1/roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get roles',
    description: 'Allows users get roles',
  })
  @ApiOkResponse({ description: 'Get roles successful ', type: [Role] })
  @UseGuards(JwtAuthGuard)
  @Get()
  async findRole(@Res() res: Response, @Req() req: Request): Promise<ResponseDTO> {
    try {
      const response = await this.roleService.find();

      return JsonResponse(res, response);
    } catch (error) {
      return ErrorResponse(res, error, req);
    }
  }
}
