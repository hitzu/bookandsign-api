import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotImplementedException,
  Param,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiNotImplementedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CreatePhotoDto } from './dto/create-photo.dto';
import { PhotoResponseDto } from './dto/photo-response.dto';
import { PhotosService } from './photos.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('photos')
@ApiTags('photos')
@ApiBearerAuth('access-token')
export class PhotosController {
  constructor(private readonly photosService: PhotosService) { }

  @Get('event/:token')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List photos for an event' })
  @ApiParam({ name: 'token', type: String, description: 'Event token (UUID)' })
  @ApiOkResponse({
    description: 'Photos for the event (ordered by createdAt DESC)',
    type: PhotoResponseDto,
    isArray: true,
  })
  @ApiNotFoundResponse({ description: 'Event not found' })
  listByEventToken(@Param('token') token: string) {
    return this.photosService.listByEventToken(token);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register photo metadata after upload' })
  @ApiBody({ type: CreatePhotoDto })
  @ApiCreatedResponse({
    description: 'Photo registered successfully',
    type: PhotoResponseDto,
  })
  @ApiOkResponse({
    description: 'Photo already exists (idempotent)',
    type: PhotoResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiNotFoundResponse({ description: 'Event not found' })
  create(@Body(new ValidationPipe()) dto: CreatePhotoDto) {
    return this.photosService.create({
      eventToken: dto.eventToken,
      storagePath: dto.storagePath,
      publicUrl: dto.publicUrl,
    });
  }

  @Post('presign')
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  @ApiOperation({ summary: 'Get presigned upload URL (stub)' })
  @ApiNotImplementedResponse({
    description:
      'Presigned URLs require SUPABASE_SERVICE_ROLE_KEY and ENABLE_SUPABASE_PRESIGN=true',
  })
  presign(): never {
    throw new NotImplementedException(
      'Presigned URLs require SUPABASE_SERVICE_ROLE_KEY and ENABLE_SUPABASE_PRESIGN=true',
    );
  }
}
