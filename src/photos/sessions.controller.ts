import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { Public } from '../auth/decorators/public.decorator';
import { CreateSessionDto } from './dto/create-session.dto';
import { ConfirmPhotoDto } from './dto/confirm-photo.dto';
import { PresignedUploadDto, PresignedUploadResponseDto } from './dto/presigned-upload.dto';
import {
  CreateSessionUploadUrlDto,
  SessionUploadUrlResponseDto,
} from './dto/create-session-upload-url.dto';
import { PhotoResponseDto } from './dto/photo-response.dto';
import {
  CreateSessionResponseDto,
  GalleryResponseDto,
  ListSessionsResponseDto,
  SessionDetailResponseDto,
  SessionResponseDto,
} from './dto/session-response.dto';
import { SessionsService } from './sessions.service';

@Controller('sessions')
@ApiTags('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) { }

  // ── v2 endpoints ──────────────────────────────────────────────────────────────

  @Post('/')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a session (sessionToken + eventToken in body)' })
  @ApiBody({ type: CreateSessionDto })
  @ApiCreatedResponse({ schema: { example: { sessionToken: 'uuid' } } })
  @ApiConflictResponse({ description: 'Session UUID already exists' })
  @ApiNotFoundResponse({ description: 'Event not found' })
  createSession(
    @Body(new ValidationPipe({ whitelist: true })) dto: CreateSessionDto,
  ): Promise<{ sessionToken: string }> {
    return this.sessionsService.createSession(dto.sessionToken, dto.eventToken);
  }

  @Post('complete')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a session as complete' })
  @ApiBody({ schema: { example: { sessionToken: 'uuid' } } })
  @ApiOkResponse({ schema: { example: { ok: true } } })
  @ApiNotFoundResponse({ description: 'Session not found' })
  completeSession(
    @Body(new ValidationPipe({ whitelist: true }))
    body: { sessionToken: string },
  ): Promise<{ ok: boolean }> {
    return this.sessionsService.completeSession(body.sessionToken);
  }

  @Get('gallery/:eventToken')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Gallery — complete sessions for an event' })
  @ApiParam({ name: 'eventToken', type: String, description: 'Event UUID' })
  @ApiOkResponse({ type: GalleryResponseDto })
  @ApiNotFoundResponse({ description: 'Event not found' })
  getGallery(
    @Param('eventToken', new ParseUUIDPipe({ version: '4' })) eventToken: string,
  ): Promise<GalleryResponseDto> {
    return this.sessionsService.getGallery(eventToken);
  }

  @Get(':sessionToken')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get session photos (guest view)' })
  @ApiParam({ name: 'sessionToken', type: String, description: 'Session UUID' })
  @ApiOkResponse({ type: SessionResponseDto })
  @ApiNotFoundResponse({ description: 'Session not found' })
  getSession(
    @Param('sessionToken', new ParseUUIDPipe({ version: '4' })) sessionToken: string,
  ): Promise<SessionResponseDto> {
    return this.sessionsService.getSession(sessionToken);
  }

  @Post('photos/presigned')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get presigned URL to upload a photo directly to Supabase' })
  @ApiBody({ type: PresignedUploadDto })
  @ApiOkResponse({ type: PresignedUploadResponseDto })
  @ApiNotFoundResponse({ description: 'Session not found' })
  getPresignedUrl(
    @Body(new ValidationPipe({ whitelist: true })) dto: PresignedUploadDto,
  ): Promise<PresignedUploadResponseDto> {
    return this.sessionsService.getPresignedUploadUrl(dto);
  }

  @Post('photos/confirm')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm photo uploaded to Supabase' })
  @ApiBody({ type: ConfirmPhotoDto })
  @ApiOkResponse({ schema: { example: { ok: true } } })
  confirmPhoto(
    @Body(new ValidationPipe({ whitelist: true })) dto: ConfirmPhotoDto,
  ): Promise<{ ok: boolean }> {
    return this.sessionsService.confirmPhotoV2(dto);
  }
}
