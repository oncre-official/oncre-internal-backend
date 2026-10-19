import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDTO {
  @ApiProperty({ type: 'boolean' })
  success: boolean | undefined;

  @ApiProperty()
  message: string | undefined;
}
