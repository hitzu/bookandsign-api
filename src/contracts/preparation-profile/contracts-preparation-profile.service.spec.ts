import { ConflictException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { ContractFactory } from '@factories/contracts/contract.factory';
import { ContractPreparationProfileFactory } from '@factories/contracts/contract-preparation-profile.factory';
import { AppDataSource as TestDataSource } from '../../config/database/data-source';
import { Contract } from '../entities/contract.entity';
import { ContractPreparationProfile } from '../entities/contract-preparation-profile.entity';
import { PrepProfileUploadsService } from './prep-profile-uploads.service';
import { ContractsPreparationProfileService } from './contracts-preparation-profile.service';

describe('ContractsPreparationProfileService (public slot-based assets)', () => {
  let service: ContractsPreparationProfileService;
  let contractsRepo: Repository<Contract>;
  let profilesRepo: Repository<ContractPreparationProfile>;
  let contractFactory: ContractFactory;
  let profileFactory: ContractPreparationProfileFactory;
  let uploadsService: Pick<
    PrepProfileUploadsService,
    'getPublicUrl' | 'createSignedReadUrl'
  >;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractsPreparationProfileService,
        {
          provide: getRepositoryToken(Contract),
          useValue: TestDataSource.getRepository(Contract),
        },
        {
          provide: getRepositoryToken(ContractPreparationProfile),
          useValue: TestDataSource.getRepository(ContractPreparationProfile),
        },
        {
          provide: PrepProfileUploadsService,
          useValue: {
            getPublicUrl: jest.fn((path: string) => path),
            createSignedReadUrl: jest.fn(async (input: { path: string }) => input.path),
          },
        },
      ],
    }).compile();

    service = module.get<ContractsPreparationProfileService>(
      ContractsPreparationProfileService,
    );
    contractsRepo = module.get<Repository<Contract>>(getRepositoryToken(Contract));
    profilesRepo = module.get<Repository<ContractPreparationProfile>>(
      getRepositoryToken(ContractPreparationProfile),
    );
    contractFactory = new ContractFactory(TestDataSource);
    profileFactory = new ContractPreparationProfileFactory(TestDataSource);
    uploadsService = module.get<PrepProfileUploadsService>(
      PrepProfileUploadsService,
    );
  });

  describe('getByToken', () => {
    it('should return a mapped DTO and map assets for assets=public', async () => {
      const contract = await contractFactory.create({
        token: 'token-get-public',
        clientPhone: '+52 (220) 175-2767',
      });
      await profileFactory.create({
        contractId: contract.id,
        answers: {
          face_photos: [{ path: 'c/1.png', mime: 'image/png' }],
        },
        locked: { face_photos: true },
      });

      const res = await service.getByToken({
        token: 'token-get-public',
        phone: '2201752767',
        assets: 'public',
      });

      expect(res.contractId).toBe(contract.id);
      expect(res.locked['face_photos']).toBe(true);
      expect(res.answers['face_photos']).toHaveLength(1);
      expect((res.answers['face_photos'] as Array<Record<string, unknown>>)[0]?.url).toBe(
        'c/1.png',
      );

      expect(uploadsService.getPublicUrl).toHaveBeenCalledWith('c/1.png');
      expect(uploadsService.createSignedReadUrl).not.toHaveBeenCalled();
    });

    it('should map assets for assets=signed', async () => {
      const contract = await contractFactory.create({
        token: 'token-get-signed',
        clientPhone: '2201752767',
      });
      await profileFactory.create({
        contractId: contract.id,
        answers: {
          face_photos: [{ path: 'c/1.png', mime: 'image/png' }],
        },
        locked: {},
      });

      const res = await service.getByToken({
        token: 'token-get-signed',
        phone: '2201752767',
        assets: 'signed',
        expiresIn: 60,
      });

      expect(res.contractId).toBe(contract.id);
      expect((res.answers['face_photos'] as Array<Record<string, unknown>>)[0]?.url).toBe(
        'c/1.png',
      );
      expect(uploadsService.createSignedReadUrl).toHaveBeenCalledWith({
        path: 'c/1.png',
        expiresIn: 60,
      });
    });

    it('should NOT map assets for assets=none', async () => {
      const contract = await contractFactory.create({
        token: 'token-get-none',
        clientPhone: '2201752767',
      });
      await profileFactory.create({
        contractId: contract.id,
        answers: {
          face_photos: [{ path: 'c/1.png', mime: 'image/png' }],
        },
        locked: {},
      });

      const res = await service.getByToken({
        token: 'token-get-none',
        phone: '2201752767',
        assets: 'none',
      });

      const asset = (res.answers['face_photos'] as Array<Record<string, unknown>>)[0] ?? {};
      expect(asset.path).toBe('c/1.png');
      expect(asset.mime).toBe('image/png');
      expect(Object.prototype.hasOwnProperty.call(asset, 'url')).toBe(false);
    });

    it('should throw NotFoundException when token is missing', async () => {
      await expect(
        service.getByToken({ token: 'missing', phone: '2201752767' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw NotFoundException when phone does not match', async () => {
      const contract = await contractFactory.create({
        token: 'token-mismatch',
        clientPhone: '2201752767',
      });

      await expect(
        service.getByToken({ token: contract.token, phone: '9999999999' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw NotFoundException when phone is empty', async () => {
      const contract = await contractFactory.create({
        token: 'token-empty-phone',
        clientPhone: '2201752767',
      });

      await expect(
        service.getByToken({ token: contract.token, phone: '' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('saveAnswerByPhone', () => {
    it('should validate input, save via bulk method, and return DTO', async () => {
      const contract = await contractFactory.create({
        token: 'token-save-one',
        clientPhone: '2201752767',
      });

      const bulkSpy = jest.spyOn(
        service as unknown as { saveAnswersBulkByContractId: (...args: unknown[]) => unknown },
        'saveAnswersBulkByContractId',
      );

      const res = await service.saveAnswerByPhone({
        token: contract.token,
        phone: '2201752767',
        questionId: 'prep_location_maps_url',
        value: 'https://maps.example.com/x',
        assets: 'none',
      });

      expect(bulkSpy).toHaveBeenCalledTimes(1);
      expect(bulkSpy).toHaveBeenCalledWith(
        contract.id,
        [{ questionId: 'prep_location_maps_url', value: 'https://maps.example.com/x' }],
        { assets: 'none', expiresIn: undefined },
      );

      expect(res.contractId).toBe(contract.id);
      expect(res.answers['prep_location_maps_url']).toBe('https://maps.example.com/x');
    });

    it('should throw NotFoundException when token is missing', async () => {
      await expect(
        service.saveAnswerByPhone({
          token: 'missing',
          phone: '2201752767',
          questionId: 'prep_location_maps_url',
          value: 'https://maps.example.com/x',
          assets: 'none',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw NotFoundException when phone does not match', async () => {
      const contract = await contractFactory.create({
        token: 'token-save-mismatch',
        clientPhone: '2201752767',
      });

      const bulkSpy = jest.spyOn(
        service as unknown as { saveAnswersBulkByContractId: (...args: unknown[]) => unknown },
        'saveAnswersBulkByContractId',
      );

      await expect(
        (
          service as unknown as {
            getContractIdByTokenAndPhone: (token: string, phone: string) => Promise<number>;
          }
        ).getContractIdByTokenAndPhone(contract.token, '9999999999'),
      ).rejects.toBeInstanceOf(NotFoundException);

      await expect(
        service.saveAnswerByPhone({
          token: contract.token,
          phone: '9999999999',
          questionId: 'prep_location_maps_url',
          value: 'https://maps.example.com/x',
          assets: 'none',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(bulkSpy).not.toHaveBeenCalled();
    });

    it('should throw UnprocessableEntityException on validation failures and not persist', async () => {
      const contract = await contractFactory.create({
        token: 'token-save-invalid',
        clientPhone: '2201752767',
      });

      const bulkSpy = jest.spyOn(
        service as unknown as { saveAnswersBulkByContractId: (...args: unknown[]) => unknown },
        'saveAnswersBulkByContractId',
      );

      await expect(
        service.saveAnswerByPhone({
          token: contract.token,
          phone: '2201752767',
          questionId: 'event_start_time',
          value: 'not-a-time',
          assets: 'none',
        }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);

      expect(bulkSpy).not.toHaveBeenCalled();

      const persisted = await profilesRepo.findOne({
        where: { contractId: contract.id },
      });
      expect(persisted).toBeNull();
    });

    it('should throw UnprocessableEntityException on invalid questionId and not persist', async () => {
      const contract = await contractFactory.create({
        token: 'token-save-bad-question',
        clientPhone: '2201752767',
      });

      await expect(
        service.saveAnswerByPhone({
          token: contract.token,
          phone: '2201752767',
          questionId: 'not-a-real-question',
          value: 'x',
          assets: 'none',
        }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);

      const persisted = await profilesRepo.findOne({
        where: { contractId: contract.id },
      });
      expect(persisted).toBeNull();
    });

    it('should throw NotFoundException when phone is empty', async () => {
      const contract = await contractFactory.create({
        token: 'token-save-empty-phone',
        clientPhone: '2201752767',
      });

      await expect(
        (
          service as unknown as {
            getContractIdByTokenAndPhone: (token: string, phone: string) => Promise<number>;
          }
        ).getContractIdByTokenAndPhone(contract.token, ''),
      ).rejects.toBeInstanceOf(NotFoundException);

      await expect(
        service.saveAnswerByPhone({
          token: contract.token,
          phone: '',
          questionId: 'prep_location_maps_url',
          value: 'https://maps.example.com/x',
          assets: 'none',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('unlockQuestion', () => {
    it('should clear the locked flag when profile exists and return DTO (assets=none)', async () => {
      const contract = await contractFactory.create({
        token: 'token-unlock-existing',
        clientPhone: '2201752767',
      });
      await profileFactory.create({
        contractId: contract.id,
        answers: {},
        locked: { face_photos: true, hair_photos: true },
      });

      const res = await service.unlockQuestion({
        contractId: contract.id,
        questionId: 'face_photos',
        reason: 'support',
      });

      expect(res.contractId).toBe(contract.id);
      expect(res.locked['face_photos']).toBeUndefined();
      expect(res.locked['hair_photos']).toBe(true);

      const persisted = await profilesRepo.findOne({
        where: { contractId: contract.id },
      });
      expect(persisted?.locked?.['face_photos']).toBeUndefined();
      expect(persisted?.locked?.['hair_photos']).toBe(true);
    });

    it('should create profile when none exists, unlock requested question, and return DTO (assets=none)', async () => {
      const contract = await contractFactory.create({
        token: 'token-unlock-create',
        clientPhone: '2201752767',
      });

      const res = await service.unlockQuestion({
        contractId: contract.id,
        questionId: 'face_photos',
        reason: 'support',
      });

      expect(res.contractId).toBe(contract.id);
      expect(res.locked['face_photos']).toBeUndefined();
      expect(res.answers).toEqual({});

      const persisted = await profilesRepo.findOne({
        where: { contractId: contract.id },
      });
      expect(persisted).not.toBeNull();
      expect(persisted?.locked?.['face_photos']).toBeUndefined();
    });

    it('should throw NotFoundException when contract does not exist', async () => {
      await expect(
        service.unlockQuestion({
          contractId: 999999,
          questionId: 'face_photos',
          reason: 'support',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw UnprocessableEntityException on invalid questionId', async () => {
      const contract = await contractFactory.create({
        token: 'token-unlock-bad-question',
        clientPhone: '2201752767',
      });

      await expect(
        service.unlockQuestion({
          contractId: contract.id,
          questionId: 'not-a-real-question',
          reason: 'support',
        }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });
  });

  it('should allow incremental uploads for face_photos until 2/2, then lock and reject extras', async () => {
    const contract = await contractFactory.create({
      token: 'token-face',
      clientPhone: '2201752767',
    });

    const first = await service.saveAnswersBulkByToken({
      token: contract.token,
      phone: '2201752767',
      assets: 'none',
      answers: [
        {
          questionId: 'face_photos',
          value: [{ path: 'c/1.png', mime: 'image/png', url: 'https://x/1' }],
        },
      ],
    });
    expect(first.answers['face_photos']).toHaveLength(1);
    expect(first.locked['face_photos']).toBeUndefined();

    const second = await service.saveAnswersBulkByToken({
      token: contract.token,
      phone: '2201752767',
      assets: 'none',
      answers: [
        {
          questionId: 'face_photos',
          value: [{ path: 'c/2.png', mime: 'image/png', url: 'https://x/2' }],
        },
      ],
    });

    expect(second.answers['face_photos']).toHaveLength(2);
    expect(second.locked['face_photos']).toBe(true);

    await expect(
      service.saveAnswersBulkByToken({
        token: contract.token,
        phone: '2201752767',
        assets: 'none',
        answers: [
          {
            questionId: 'face_photos',
            value: [{ path: 'c/3.png', mime: 'image/png' }],
          },
        ],
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    const persisted = await profilesRepo.findOne({
      where: { contractId: contract.id },
    });
    expect(persisted?.locked?.['face_photos']).toBe(true);
  });

  it('should allow incremental uploads for hair_photos until 3/3, then lock', async () => {
    const contract = await contractFactory.create({
      token: 'token-hair',
      clientPhone: '2201752767',
    });

    await service.saveAnswersBulkByToken({
      token: contract.token,
      phone: '2201752767',
      assets: 'none',
      answers: [
        { questionId: 'hair_photos', value: [{ path: 'h/1.png', mime: 'image/png' }] },
      ],
    });
    const two = await service.saveAnswersBulkByToken({
      token: contract.token,
      phone: '2201752767',
      assets: 'none',
      answers: [
        { questionId: 'hair_photos', value: [{ path: 'h/2.png', mime: 'image/png' }] },
      ],
    });
    expect(two.locked['hair_photos']).toBeUndefined();

    const three = await service.saveAnswersBulkByToken({
      token: contract.token,
      phone: '2201752767',
      assets: 'none',
      answers: [
        { questionId: 'hair_photos', value: [{ path: 'h/3.png', mime: 'image/png' }] },
      ],
    });
    expect(three.answers['hair_photos']).toHaveLength(3);
    expect(three.locked['hair_photos']).toBe(true);
  });

  it('should NOT 409 when a slot-based field is locked but still incomplete (legacy), and should lock only when complete', async () => {
    const contract = await contractFactory.create({
      token: 'token-legacy',
      clientPhone: '2201752767',
    });

    await profilesRepo.save(
      profilesRepo.create({
        contractId: contract.id,
        answers: { face_photos: [{ path: 'c/1.png', mime: 'image/png' }] },
        locked: { face_photos: true },
      }),
    );

    const res = await service.saveAnswersBulkByToken({
      token: contract.token,
      phone: '2201752767',
      assets: 'none',
      answers: [
        {
          questionId: 'face_photos',
          value: [{ path: 'c/2.png', mime: 'image/png' }],
        },
      ],
    });

    expect(res.answers['face_photos']).toHaveLength(2);
    expect(res.locked['face_photos']).toBe(true);

    // Sanity: ensure contract exists (guards against false positive from NotFound).
    const persistedContract = await contractsRepo.findOne({
      where: { id: contract.id },
    });
    expect(persistedContract).not.toBeNull();
  });
});

