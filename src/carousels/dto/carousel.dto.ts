import { Expose } from 'class-transformer';

export class CarouselDto {
  @Expose()
  id!: number;

  @Expose()
  page!: string;

  @Expose()
  section!: string;

  @Expose()
  brandId: number | null = null;

  @Expose()
  contentType!: string;

  @Expose()
  title: string | null = null;

  @Expose()
  subtitle: string | null = null;

  @Expose()
  description: string | null = null;

  @Expose()
  imageUrl!: string;

  @Expose()
  ctaLabel: string | null = null;

  @Expose()
  ctaUrl: string | null = null;

  @Expose()
  metadata!: Record<string, unknown>;

  @Expose()
  sortOrder!: number;

  @Expose()
  status!: string;
}
