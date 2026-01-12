import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Post,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { EXCEPTION_RESPONSE } from '../config/errors/exception-response.config';
import type { DecodedTokenDto } from '../tokens/dto/decode-token.dto';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { CreateNoteDto } from './dto/create-note.dto';
import { NoteDto } from './dto/note.dto';
import { NotesService } from './notes.service';
import { NOTE_SCOPE } from './types/note-scope.types';
import { NOTE_KIND } from './types/note-kind.types';

@Controller('notes')
@ApiTags('notes')
@ApiBearerAuth('access-token')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get(':scope/:targetId')
  @ApiOperation({ summary: 'List notes for a target' })
  @ApiParam({
    name: 'scope',
    type: String,
    enum: NOTE_SCOPE,
    description: 'Scope',
  })
  @ApiParam({ name: 'targetId', type: Number, description: 'Target id' })
  @ApiOkResponse({
    description: 'Notes for the target (ascending by createdAt)',
    type: NoteDto,
    isArray: true,
  })
  @ApiNotFoundResponse({
    description: EXCEPTION_RESPONSE.SLOT_NOT_FOUND.message,
  })
  findNotesByTarget(
    @Param('scope', new ParseEnumPipe(NOTE_SCOPE)) scope: NOTE_SCOPE,
    @Param('targetId', ParseIntPipe) targetId: number,
    @Query('kind', new ParseEnumPipe(NOTE_KIND))
    kind: NOTE_KIND,
  ) {
    return this.notesService.findTimelineByTarget(scope, targetId, kind);
  }

  @Post()
  @ApiOperation({ summary: 'Create a note for a target' })
  @ApiBody({ type: CreateNoteDto })
  @ApiCreatedResponse({
    description: 'Note created successfully',
    type: NoteDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiNotFoundResponse({
    description: EXCEPTION_RESPONSE.SLOT_NOT_FOUND.message,
  })
  createNote(
    @Body(new ValidationPipe()) createNoteDto: CreateNoteDto,
    @AuthUser() user: DecodedTokenDto,
  ) {
    const createdBy = user.id;
    return this.notesService.createForTarget({
      scope: createNoteDto.scope,
      targetId: createNoteDto.targetId,
      content: createNoteDto.content,
      kind: createNoteDto.kind,
      createdBy,
    });
  }
}
