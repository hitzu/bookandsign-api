import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { BrandDto } from './dto/brand.dto';
import { Logger } from '@nestjs/common';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { DecodedTokenDto } from '../tokens/dto/decode-token.dto';

@Controller('brands')
export class BrandsController {
  private readonly logger = new Logger(BrandsService.name);
  constructor(private readonly brandsService: BrandsService) {}

  @Post()
  create(@Body() createBrandDto: CreateBrandDto) {
    try {
      this.logger.log({ createBrandDto }, 'Creating brand since controller');
      return this.brandsService.create(createBrandDto);
    } catch (error) {
      this.logger.error(error, 'Error creating brand since controller');
      throw error;
    }
  }

  @Get()
  findAll(@AuthUser() user: DecodedTokenDto): Promise<BrandDto[]> {
    this.logger.log(
      {
        user: {
          id: user.id,
          email: user.email,
          sub: user.sub,
          type: user.type,
          exp: user.exp,
        },
        decodedToken: user,
      },
      'User accessing brands - Token decoded information',
    );
    return this.brandsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.brandsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBrandDto: UpdateBrandDto,
  ) {
    return this.brandsService.update(id, updateBrandDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.brandsService.remove(+id);
  }
}
