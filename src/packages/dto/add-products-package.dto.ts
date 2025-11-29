import { IsArray, IsNumber } from 'class-validator';
import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ProductToPackageDto {
  @IsNumber()
  productId!: number;

  @IsNumber()
  quantity!: number;
}

export class AddProductsToPackageDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductToPackageDto)
  products!: ProductToPackageDto[];
}
