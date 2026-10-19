import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, ApiUnprocessableEntityResponse } from '@nestjs/swagger';

import { Roles } from '@on/decorators/roles.decorator';
import { User } from '@on/decorators/user.decorator';
import { ErrorResponse, JsonResponse } from '@on/handlers/responses';
import { requestFilter } from '@on/helpers/filter';
import { ApiResponseDTO } from '@on/utils/dto/response.dto';
import { ResponseDTO } from '@on/utils/types';

import { JwtAuthGuard } from '../auth/guard/auth.guard';
import { RoleGuard } from '../auth/guard/role.guard';
import { User as UserDocument } from '../user/model/user.model';

import { AdminService } from './admin.service';
import { AdminCreateUserDto, AdminUpdateUserDto } from './dto/create-user.dto';
import { RolePermissionsDto } from './dto/permission.dto';
import { QueryUserDto } from './dto/query.dto';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { UpdateUserRoleDto } from './dto/user-role.dto';

import type { Response, Request } from 'express';

@ApiTags('Admin')
@ApiUnprocessableEntityResponse({ description: 'Error occurred', type: ApiResponseDTO })
@Controller('api/v1/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * USER SECTION
   */

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get users',
    description: 'Allow admin get users',
  })
  @ApiOkResponse({ description: 'Get users successful ', type: ApiResponseDTO })
  @UseGuards(JwtAuthGuard)
  @Get('users')
  async findUser(@Query() query: QueryUserDto, @Res() res: Response, @Req() req: Request): Promise<ResponseDTO> {
    try {
      const { skip, limit } = query;

      const filter = requestFilter(query);

      const response = await this.adminService.findUser(filter, skip, limit);

      return JsonResponse(res, response);
    } catch (error) {
      return ErrorResponse(res, error, req);
    }
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create user',
    description: 'Allow admin create users',
  })
  @ApiOkResponse({ description: 'Create user successful ', type: ApiResponseDTO })
  @Roles('admin', 'super-admin')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Post('user')
  async createUser(
    @Body() payload: AdminCreateUserDto,
    @User() user: UserDocument,
    @Res() res: Response,
    @Req() req: Request,
  ): Promise<ResponseDTO> {
    try {
      const response = await this.adminService.createUser(user, payload);

      return JsonResponse(res, response);
    } catch (error) {
      return ErrorResponse(res, error, req);
    }
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update user',
    description: 'Allow admin update users',
  })
  @ApiOkResponse({ description: 'Update user successful ', type: ApiResponseDTO })
  @Roles('admin', 'super-admin')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Post('user/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() payload: AdminUpdateUserDto,
    @Res() res: Response,
    @Req() req: Request,
  ): Promise<ResponseDTO> {
    try {
      const response = await this.adminService.updateUser(id, payload);

      return JsonResponse(res, response);
    } catch (error) {
      return ErrorResponse(res, error, req);
    }
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete user',
    description: 'Allow admin delete users',
  })
  @ApiOkResponse({ description: 'Delete user successful ', type: ApiResponseDTO })
  @Roles('admin', 'super-admin')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Post('user/delete/:id')
  async deleteUser(@Param('id') id: string, @Res() res: Response, @Req() req: Request): Promise<ResponseDTO> {
    try {
      const response = await this.adminService.deleteUser(id);

      return JsonResponse(res, response);
    } catch (error) {
      return ErrorResponse(res, error, req);
    }
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Assign or remove user role',
    description: 'Allow admin assign a role to a user or remove the current role and assign the tenant default role',
  })
  @ApiOkResponse({ description: 'User role updated successfully', type: ApiResponseDTO })
  @Roles('admin', 'super-admin')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Patch('user/:id/role')
  async updateUserRole(
    @Param('id') id: string,
    @Body() payload: UpdateUserRoleDto,
    @Res() res: Response,
    @Req() req: Request,
  ): Promise<any> {
    try {
      const response = await this.adminService.updateUserRole(id, payload);

      return JsonResponse(res, response);
    } catch (error) {
      return ErrorResponse(res, error, req);
    }
  }

  /**
   * ROLES & PERMISSIONS SECTION
   */

  @ApiOperation({
    summary: 'Create role',
    description: 'Allow admin create a role',
  })
  @ApiOkResponse({ description: 'Role created successfully', type: ApiResponseDTO })
  @Roles('admin', 'super-admin')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Post('role')
  async createRole(@Body() payload: CreateRoleDto, @Res() res: Response, @Req() req: Request): Promise<any> {
    try {
      const response = await this.adminService.createRole(payload);

      return JsonResponse(res, response);
    } catch (error) {
      return ErrorResponse(res, error, req);
    }
  }

  @ApiOperation({
    summary: 'Update role',
    description: 'Allow admin update a role',
  })
  @ApiOkResponse({ description: 'Role updated successfully', type: ApiResponseDTO })
  @Roles('admin', 'super-admin')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Patch('role/:id')
  async updateRole(
    @Param('id') id: string,
    @Body() payload: UpdateRoleDto,
    @Res() res: Response,
    @Req() req: Request,
  ): Promise<any> {
    try {
      const response = await this.adminService.updateRole(id, payload);

      return JsonResponse(res, response);
    } catch (error) {
      return ErrorResponse(res, error, req);
    }
  }

  @ApiOperation({
    summary: 'Delete role',
    description: 'Allow admin delete a role',
  })
  @ApiOkResponse({ description: 'Role deleted successfully', type: ApiResponseDTO })
  @Roles('admin', 'super-admin')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Delete('role/:id')
  async deleteRole(@Param('id') id: string, @Res() res: Response, @Req() req: Request): Promise<any> {
    try {
      const response = await this.adminService.deleteRole(id);

      return JsonResponse(res, response);
    } catch (error) {
      return ErrorResponse(res, error, req);
    }
  }

  @ApiOperation({
    summary: 'Assign permissions to role',
    description: 'Allow admin assign one or more permissions to a role',
  })
  @ApiOkResponse({ description: 'Permissions assigned successfully', type: ApiResponseDTO })
  @Roles('admin', 'super-admin')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Post('role/:id/permissions')
  async assignRolePermissions(
    @Param('id') id: string,
    @Body() payload: RolePermissionsDto,
    @Res() res: Response,
    @Req() req: Request,
  ): Promise<any> {
    try {
      const response = await this.adminService.assignRolePermissions(id, payload);

      return JsonResponse(res, response);
    } catch (error) {
      return ErrorResponse(res, error, req);
    }
  }

  @ApiOperation({
    summary: 'Remove permission from role',
    description: 'Allow admin remove a permission from a role',
  })
  @ApiOkResponse({ description: 'Permission removed successfully', type: ApiResponseDTO })
  @Roles('admin', 'super-admin')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Delete('role/:id/permissions')
  async removeRolePermission(
    @Param('id') id: string,
    @Body() payload: RolePermissionsDto,
    @Res() res: Response,
    @Req() req: Request,
  ): Promise<any> {
    try {
      const response = await this.adminService.removeRolePermissions(id, payload);

      return JsonResponse(res, response);
    } catch (error) {
      return ErrorResponse(res, error, req);
    }
  }
}
