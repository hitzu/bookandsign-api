import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiHeader, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';

import { ReconciliationService } from './reconciliation.service';

@Controller('admin')
@ApiTags('admin')
export class ReconciliationController {
  constructor(private readonly reconciliationService: ReconciliationService) { }

  @Post('reconcile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger manual photo reconciliation' })
  @ApiHeader({ name: 'x-api-key', description: 'Admin API key', required: true })
  @ApiOkResponse({ schema: { example: { reconciled: 3 } } })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing API key' })
  reconcile(): Promise<{ reconciled: number }> {
    return this.reconciliationService.reconcile();
  }
}
