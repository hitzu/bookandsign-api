import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createClient } from '@supabase/supabase-js';
import { plainToInstance } from 'class-transformer';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';

import { Contract } from '../entities/contract.entity';
import { PrepProfileUploadUrlDto } from './dto/prep-profile-upload-url.dto';
import { assertPrepProfileQuestionId } from './prep-profile.validation';
import { EXCEPTION_RESPONSE } from '../../config/errors/exception-response.config';

function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 10) {
    return digits;
  }
  return digits.slice(-10);
}

function phonesMatch(a: string | null, b: string): boolean {
  if (!a) {
    return false;
  }
  const left = normalizePhone(a);
  const right = normalizePhone(b);
  return left.length > 0 && left === right;
}

function sanitizeFileName(fileName: string): string {
  const trimmed = fileName.trim();
  const noPath = trimmed.replace(/[\\/]/g, '_');
  const safe = noPath.replace(/[^\w.-]+/g, '_');
  return safe.length > 120 ? safe.slice(-120) : safe;
}

@Injectable()
export class PrepProfileUploadsService {
  private _client:
    | ReturnType<typeof createClient>
    | undefined;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Contract)
    private readonly contractsRepository: Repository<Contract>,
  ) { }

  private get client() {
    if (this._client) {
      return this._client;
    }

    const url = this.configService.get<string>('SUPABASE_URL');
    const serviceKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !serviceKey) {
      throw new InternalServerErrorException(
        'Supabase storage is not configured',
      );
    }

    this._client = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return this._client;
  }

  private get bucket(): string {
    const bucket = this.configService.get<string>('SUPABASE_STORAGE_BUCKET');
    return bucket || 'public';
  }

  getPublicUrl(path: string): string {
    const baseUrl = this.configService.get<string>('SUPABASE_URL');
    if (!baseUrl) {
      throw new InternalServerErrorException(EXCEPTION_RESPONSE.SUPABASE_STORAGE_NOT_CONFIGURED);
    }
    return `${baseUrl.replace(/\/$/, '')}/storage/v1/object/public/${this.bucket}/${path}`;
  }

  async createSignedReadUrl(input: {
    path: string;
    expiresIn: number;
  }): Promise<string> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUrl(input.path, input.expiresIn);

    if (error || !data?.signedUrl) {
      throw new InternalServerErrorException('Failed to create signed read URL');
    }

    return data.signedUrl;
  }

  async createSignedUploadUrl(input: {
    token: string;
    phone: string;
    questionId: string;
    fileName: string;
    mime: string;
  }): Promise<PrepProfileUploadUrlDto> {
    const question = assertPrepProfileQuestionId(input.questionId);
    const objectQuestionsThatAcceptAssets = new Set<string>([
      'dress',
      'accessories',
    ]);
    const acceptsAssets =
      question.type === 'asset' ||
      question.type === 'asset_array' ||
      (question.type === 'object' && objectQuestionsThatAcceptAssets.has(question.id));

    if (!acceptsAssets) {
      throw new UnprocessableEntityException(
        `Question ${input.questionId} does not accept assets`,
      );
    }

    const contract = await this.contractsRepository.findOne({
      where: { token: input.token },
      select: { id: true, clientPhone: true },
    });
    if (!contract || !phonesMatch(contract.clientPhone ?? null, input.phone)) {
      throw new NotFoundException('Contract not found');
    }

    const name = sanitizeFileName(input.fileName);
    const path = `${contract.id}/${input.questionId}/${randomUUID()}_${name}`;

    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUploadUrl(path);

    if (error || !data?.signedUrl || !data?.token) {
      throw new InternalServerErrorException('Failed to create signed upload URL');
    }

    return plainToInstance(
      PrepProfileUploadUrlDto,
      {
        contractId: contract.id,
        bucket: this.bucket,
        path,
        signedUrl: data.signedUrl,
        token: data.token,
        publicUrl: this.getPublicUrl(path),
      },
      { excludeExtraneousValues: true },
    );
  }
}

