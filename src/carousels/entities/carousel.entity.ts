import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseTimeEntity } from '../../common/entities/base-time.entity';
import { Brand } from '../../brands/entities/brand.entity';

@Entity('carousels')
export class Carousel extends BaseTimeEntity {
  @Column('text')
  page!: string;

  @Column('text')
  section!: string;

  @Column('integer', { name: 'brand_id', nullable: true })
  brandId: number | null = null;

  @ManyToOne(() => Brand, { nullable: true })
  @JoinColumn({ name: 'brand_id' })
  brand?: Brand | null;

  @Column('text', { name: 'content_type', default: 'image' })
  contentType: string = 'image';

  @Column('text', { nullable: true })
  title: string | null = null;

  @Column('text', { nullable: true })
  subtitle: string | null = null;

  @Column('text', { nullable: true })
  description: string | null = null;

  @Column('text', { name: 'image_url' })
  imageUrl!: string;

  @Column('text', { name: 'cta_label', nullable: true })
  ctaLabel: string | null = null;

  @Column('text', { name: 'cta_url', nullable: true })
  ctaUrl: string | null = null;

  @Column('jsonb', { default: {} })
  metadata: Record<string, unknown> = {};

  @Column('integer', { name: 'sort_order', default: 0 })
  sortOrder: number = 0;

  @Column('text', { default: 'active' })
  status: string = 'active';
}
