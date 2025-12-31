import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TermsService } from './terms.service';
import { TermsController } from './terms.controller';
import { Term } from './entities/term.entity';
import { PackageTerm } from './entities/package-term.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Term, PackageTerm])],
  controllers: [TermsController],
  providers: [TermsService],
  exports: [TermsService],
})
export class TermsModule {}

