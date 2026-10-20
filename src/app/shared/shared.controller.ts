import { Body, Controller, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { FormDataRequest } from 'nestjs-form-data';

import { ErrorResponse, JsonResponse } from '@on/handlers/responses';
import { requestFilter } from '@on/helpers/filter';
import { FileDto } from '@on/utils/dto/file.dto';
import { ApiResponseDTO } from '@on/utils/dto/response.dto';
import { ResponseDTO } from '@on/utils/types';

import { JwtAuthGuard } from '../auth/guard/auth.guard';

import { LgaQueryDto, StateQueryDto } from './dto/state-local.dto';
import { SharedService } from './shared.service';

import type { Response, Request } from 'express';

@ApiTags('Shared')
@ApiUnprocessableEntityResponse({
  description: 'Error occurred',
  type: ApiResponseDTO,
})
@Controller('api/v1/shared')
export class SharedController {
  constructor(private readonly sharedService: SharedService) {}

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get states',
    description: 'Allow users get states',
  })
  @ApiOkResponse({
    description: 'Get states successful ',
    type: ApiResponseDTO,
  })
  @UseGuards(JwtAuthGuard)
  @Get('state')
  async findState(@Query() query: StateQueryDto, @Res() res: Response, @Req() req: Request): Promise<ResponseDTO> {
    try {
      const filter = requestFilter(query);

      const response = await this.sharedService.findState(filter);

      return JsonResponse(res, response);
    } catch (error) {
      return ErrorResponse(res, error, req);
    }
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get local government area',
    description: 'Allow users get local',
  })
  @ApiOkResponse({ description: 'Get lgas successful ', type: ApiResponseDTO })
  @UseGuards(JwtAuthGuard)
  @Get('lga')
  async findLga(@Query() query: LgaQueryDto, @Res() res: Response, @Req() req: Request): Promise<ResponseDTO> {
    try {
      const filter = requestFilter(query);

      const response = await this.sharedService.findLga(filter);

      return JsonResponse(res, response);
    } catch (error) {
      return ErrorResponse(res, error, req);
    }
  }

  /**
   * FILE UPLOAD
   */

  @ApiOperation({
    summary: 'Upload File',
    description: 'Allow users upload file',
  })
  @ApiOkResponse({ description: 'File Uploaded successfully', type: ApiResponseDTO })
  @ApiConsumes('multipart/form-data')
  @FormDataRequest()
  @Post('upload-file')
  async upload(@Body() payload: FileDto, @Res() res: Response, @Req() req: Request): Promise<ResponseDTO> {
    try {
      const response = await this.sharedService.uploadFile(payload);

      return JsonResponse(res, response);
    } catch (error) {
      return ErrorResponse(res, error, req);
    }
  }
}
