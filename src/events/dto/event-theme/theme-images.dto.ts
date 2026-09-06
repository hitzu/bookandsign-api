import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, plainToInstance } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  validateSync,
} from 'class-validator';

export class ThemeImageAssetDto {
  @Expose()
  @ApiProperty({ example: 'themes/amor-eterno/splash.png' })
  @IsString()
  @IsNotEmpty()
  path!: string;

  @Expose()
  @ApiProperty({
    example:
      'https://<project>.supabase.co/storage/v1/object/public/public/themes/amor-eterno/splash.png',
  })
  @IsString()
  @IsNotEmpty()
  url!: string;

  @Expose()
  @ApiPropertyOptional({ example: 'Amor Eterno' })
  @IsOptional()
  @IsString()
  alt?: string;

  @Expose()
  @ApiPropertyOptional({ example: 'image/png' })
  @IsOptional()
  @IsString()
  mime?: string;
}

export type ThemeImageMap = Record<string, ThemeImageAssetDto>;

@ValidatorConstraint({ name: 'isThemeImageMap', async: false })
export class IsThemeImageMapConstraint
  implements ValidatorConstraintInterface
{
  private lastError = 'images must be a map of theme image entries';

  validate(value: unknown): boolean {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      this.lastError = 'images must be an object map, not an array or scalar';
      return false;
    }

    for (const [key, entry] of Object.entries(
      value as Record<string, unknown>,
    )) {
      const instance = plainToInstance(ThemeImageAssetDto, entry);
      const errors = validateSync(instance, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });

      if (errors.length > 0) {
        const messages = errors
          .flatMap((error) => Object.values(error.constraints ?? {}))
          .join(', ');
        this.lastError = `${key}: ${messages}`;
        return false;
      }
    }

    return true;
  }

  defaultMessage(): string {
    return this.lastError;
  }
}

export function IsThemeImageMap() {
  return Validate(IsThemeImageMapConstraint);
}
