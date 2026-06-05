import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TermsService } from './terms.service';
import { TermsController } from './terms.controller';
import { Term } from './entities/term.entity';
import { PackageTerm } from './entities/package-term.entity';
import { BrandTerm } from './entities/brand-term.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Term, PackageTerm, BrandTerm])],
  controllers: [TermsController],
  providers: [TermsService],
  exports: [TermsService],
})
export class TermsModule {}
