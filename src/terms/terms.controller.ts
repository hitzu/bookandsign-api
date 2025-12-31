import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { TermsService } from './terms.service';
import { CreateTermDto } from './dto/create-term.dto';
import { UpdateTermDto } from './dto/update-term.dto';
import { AddPackageTermDto } from './dto/add-package-term.dto';
import { RemovePackageTermDto } from './dto/remove-package-term.dto';
import { BulkUpsertPackageTermsDto } from './dto/bulk-upsert-package-terms.dto';
import { FindAllTermsQueryDto } from './dto/find-all-terms-query.dto';
import { Term } from './entities/term.entity';
import { TermDto } from './dto/term.dto';

@Controller('terms')
@ApiTags('terms')
@ApiBearerAuth('access-token')
export class TermsController {
  constructor(private readonly termsService: TermsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a term' })
  @ApiBody({ type: CreateTermDto })
  @ApiCreatedResponse({
    description: 'Term created successfully',
    type: TermDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  create(@Body() createTermDto: CreateTermDto) {
    return this.termsService.create(createTermDto);
  }

  @Get()
  @ApiOperation({ summary: 'List terms with optional filters' })
  @ApiQuery({
    name: 'scope',
    required: false,
    description: 'Filter by scope (global or package)',
    enum: ['global', 'package'],
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Search query (searches in title and content)',
    type: String,
  })
  @ApiOkResponse({
    description: 'Terms found successfully',
    type: Term,
    isArray: true,
  })
  findAll(@Query(new ValidationPipe()) query: FindAllTermsQueryDto) {
    return this.termsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a term by id' })
  @ApiParam({ name: 'id', type: Number, description: 'Term id' })
  @ApiOkResponse({ description: 'Term found successfully', type: Term })
  findOne(@Param('id') id: string) {
    return this.termsService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a term' })
  @ApiParam({ name: 'id', type: Number, description: 'Term id' })
  @ApiBody({ type: UpdateTermDto })
  @ApiOkResponse({ description: 'Term updated successfully' })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  update(@Param('id') id: number, @Body() updateTermDto: UpdateTermDto) {
    return this.termsService.update(id, updateTermDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove (soft delete) a term' })
  @ApiParam({ name: 'id', type: Number, description: 'Term id' })
  @ApiOkResponse({ description: 'Term removed successfully' })
  remove(@Param('id') id: string) {
    return this.termsService.remove(+id);
  }

  @Post('packages')
  @ApiOperation({ summary: 'Create a package-term association' })
  @ApiBody({ type: AddPackageTermDto })
  @ApiCreatedResponse({
    description: 'Package-term association created successfully',
  })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  addPackageTerm(@Body() addPackageTermDto: AddPackageTermDto) {
    return this.termsService.addPackageTerm(addPackageTermDto);
  }

  @Delete('packages')
  @ApiOperation({ summary: 'Remove a package-term association' })
  @ApiBody({ type: RemovePackageTermDto })
  @ApiOkResponse({
    description: 'Package-term association removed successfully',
  })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  removePackageTerm(@Body() removePackageTermDto: RemovePackageTermDto) {
    return this.termsService.removePackageTerm(removePackageTermDto);
  }

  @Post(':termId/packages/bulk')
  @ApiOperation({ summary: 'Bulk upsert package-term associations' })
  @ApiParam({ name: 'termId', type: Number, description: 'Term id' })
  @ApiBody({ type: BulkUpsertPackageTermsDto })
  @ApiCreatedResponse({
    description: 'Package-term associations updated successfully',
  })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  bulkUpsertPackageTerms(
    @Param('termId') termId: string,
    @Body() bulkUpsertPackageTermsDto: BulkUpsertPackageTermsDto,
  ) {
    const { packageIds } = bulkUpsertPackageTermsDto;
    return this.termsService.bulkUpsertPackageTerms({
      packageIds,
      termId: +termId,
    });
  }

  @Get('packages/:packageId')
  @ApiOperation({ summary: 'Get terms associated with a package' })
  @ApiParam({ name: 'packageId', type: Number, description: 'Package id' })
  @ApiOkResponse({
    description: 'Terms found successfully',
    type: Term,
    isArray: true,
  })
  findByPackage(@Param('packageId') packageId: string) {
    return this.termsService.findByPackage(+packageId);
  }
}
