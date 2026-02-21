import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppDataSource as TestDataSource } from '../config/database/data-source';
import { EXCEPTION_RESPONSE } from '../config/errors/exception-response.config';
import { ContractFactory } from '../../test/factories/contracts/contract.factory';
import { EventFactory } from '../../test/factories/events/event.factory';
import { Event } from './entities/event.entity';
import { EventsService } from './events.service';
import { PinoLogger } from 'nestjs-pino';

describe('EventsService', () => {
  let service: EventsService;
  let eventFactory: EventFactory;

  beforeEach(async () => {

    const loggerMock = {
      setContext: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: getRepositoryToken(Event),
          useValue: TestDataSource.getRepository(Event),
        },
        {
          provide: PinoLogger,
          useValue: loggerMock,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    eventFactory = new EventFactory(TestDataSource);
  });

  describe('create', () => {
    it('should create event with generated UUID token', async () => {
      const contractFactory = new ContractFactory(TestDataSource);
      const contract = await contractFactory.create();

      const result = await service.create({
        contractId: contract.id,
        name: 'Test Event',
        key: 'unique-key-001',
        description: 'Test description',
      });

      expect(result.id).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.token).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      expect(result.name).toBe('Test Event');
      expect(result.key).toBe('unique-key-001');
      expect(result.contractId).toBe(contract.id);
    });

    it('should throw ConflictException when key already exists', async () => {
      const event = await eventFactory.create({ key: 'duplicate-key' });

      await expect(
        service.create({
          contractId: event.contractId,
          name: 'Another Event',
          key: 'duplicate-key',
        }),
      ).rejects.toEqual(
        new ConflictException(EXCEPTION_RESPONSE.EVENT_KEY_ALREADY_EXISTS),
      );
    });
  });

  describe('getByToken', () => {
    it('should return event when token exists', async () => {
      const event = await eventFactory.create();

      const result = await service.getByToken(event.token);

      expect(result.id).toBe(event.id);
      expect(result.token).toBe(event.token);
      expect(result.name).toBe(event.name);
    });

    it('should throw NotFoundException when token does not exist', async () => {
      await expect(
        service.getByToken('00000000-0000-0000-0000-000000000000'),
      ).rejects.toEqual(
        new NotFoundException(EXCEPTION_RESPONSE.EVENT_NOT_FOUND),
      );
    });
  });

  describe('getByKey', () => {
    it('should return event when key exists', async () => {
      const event = await eventFactory.create({ key: 'wedding-2025-001' });

      const result = await service.getByKey('wedding-2025-001');

      expect(result.id).toBe(event.id);
      expect(result.key).toBe('wedding-2025-001');
      expect(result.name).toBe(event.name);
      expect(result.token).toBe(event.token);
    });

    it('should throw NotFoundException when key does not exist', async () => {
      await expect(
        service.getByKey('non-existent-key'),
      ).rejects.toEqual(
        new NotFoundException(EXCEPTION_RESPONSE.EVENT_NOT_FOUND),
      );
    });
  });
});
