import { Module } from '@nestjs/common';
import { PackagesService } from './packages.service';
import { PackagesController } from './packages.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Package } from './entities/package.entity';
import { PackageProduct } from './entities/package-product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Package, PackageProduct])],
  controllers: [PackagesController],
  providers: [PackagesService],
})
export class PackagesModule {}
