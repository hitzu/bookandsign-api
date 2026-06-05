import {
  BadRequestException,
  Controller,
  Get,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { CarouselsService } from './carousels.service';
import { CarouselDto } from './dto/carousel.dto';
import { GetCarouselsQueryDto } from './dto/get-carousels-query.dto';

const EXPO_BEBE_PAGE = 'expo-bebe';

@Controller('carousels')
@ApiTags('carousels')
@ApiBearerAuth('access-token')
export class CarouselsController {
  constructor(private readonly carouselsService: CarouselsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get carousel items by page and section' })
  @ApiOkResponse({ type: CarouselDto, isArray: true })
  @ApiBadRequestResponse({ description: 'Missing required params' })
  findAll(@Query(new ValidationPipe()) query: GetCarouselsQueryDto) {
    if (query.page === EXPO_BEBE_PAGE && !query.brandId) {
      throw new BadRequestException('brandId is required for page expo-bebe');
    }

    return this.carouselsService.findByPageSection(
      query.page,
      query.section,
      query.brandId ? +query.brandId : undefined,
    );
  }
}
