import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
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
import type { Request } from 'express';
import { EXCEPTION_RESPONSE } from '../config/errors/exception-response.config';
import { DecodedTokenDto } from '../tokens/dto/decode-token.dto';
import { CreateNoteDto } from './dto/create-note.dto';
import { NoteResponseDto } from './dto/note-response.dto';
import { NotesService } from './notes.service';
import { NOTE_SCOPE } from './types/note-scope.types';

interface AuthenticatedRequest extends Request {
  user?: DecodedTokenDto;
}

@Controller()
@ApiTags('notes')
@ApiBearerAuth('access-token')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get('slots/:slotId/notes')
  @ApiOperation({ summary: 'List notes for a slot' })
  @ApiParam({ name: 'slotId', type: Number, description: 'Slot id' })
  @ApiOkResponse({
    description: 'Notes for the slot (ascending by createdAt)',
    type: NoteResponseDto,
    isArray: true,
  })
  @ApiNotFoundResponse({
    description: EXCEPTION_RESPONSE.SLOT_NOT_FOUND.message,
  })
  findSlotNotes(@Param('slotId') slotId: string) {
    return this.notesService.findTimelineByTarget(NOTE_SCOPE.SLOT, +slotId);
  }

  @Post('slots/:slotId/notes')
  @ApiOperation({ summary: 'Create a note for a slot' })
  @ApiParam({ name: 'slotId', type: Number, description: 'Slot id' })
  @ApiBody({ type: CreateNoteDto })
  @ApiCreatedResponse({
    description: 'Note created successfully',
    type: NoteResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @ApiNotFoundResponse({
    description: EXCEPTION_RESPONSE.SLOT_NOT_FOUND.message,
  })
  createSlotNote(
    @Param('slotId') slotId: string,
    @Body(new ValidationPipe()) createNoteDto: CreateNoteDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const createdBy = req.user?.id ?? null;
    return this.notesService.createForTarget(
      NOTE_SCOPE.SLOT,
      +slotId,
      createNoteDto,
      createdBy,
    );
  }

  @Get('contracts/:contractId/notes')
  @ApiOperation({ summary: 'List notes for a contract' })
  @ApiParam({ name: 'contractId', type: Number, description: 'Contract id' })
  @ApiOkResponse({
    description: 'Notes for the contract (ascending by createdAt)',
    type: NoteResponseDto,
    isArray: true,
  })
  findContractNotes(@Param('contractId') contractId: string) {
    return this.notesService.findTimelineByTarget(
      NOTE_SCOPE.CONTRACT,
      +contractId,
    );
  }

  @Post('contracts/:contractId/notes')
  @ApiOperation({ summary: 'Create a note for a contract' })
  @ApiParam({ name: 'contractId', type: Number, description: 'Contract id' })
  @ApiBody({ type: CreateNoteDto })
  @ApiCreatedResponse({
    description: 'Note created successfully',
    type: NoteResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  createContractNote(
    @Param('contractId') contractId: string,
    @Body(new ValidationPipe()) createNoteDto: CreateNoteDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const createdBy = req.user?.id ?? null;
    return this.notesService.createForTarget(
      NOTE_SCOPE.CONTRACT,
      +contractId,
      createNoteDto,
      createdBy,
    );
  }
}


