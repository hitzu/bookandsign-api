import { Expose, Type } from 'class-transformer';
import { ProductDto } from '../../products/dto/product.dto';

export class PackageProductsDto {
  @Expose()
  id!: number;

  @Expose()
  @Type(() => ProductDto)
  product!: ProductDto;

  @Expose()
  quantity!: number;
}
