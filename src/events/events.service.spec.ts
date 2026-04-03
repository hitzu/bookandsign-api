import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppDataSource as TestDataSource } from '../config/database/data-source';
import { EXCEPTION_RESPONSE } from '../config/errors/exception-response.config';
import { ContractFactory } from '../../test/factories/contracts/contract.factory';
import { EventFactory } from '../../test/factories/events/event.factory';
import { Event } from './entities/event.entity';
import { EventsService } from './events.service';
import { EventTypeFactory } from '../../test/factories/events/event-type.factory'
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
      const eventTypeFactory = new EventTypeFactory(TestDataSource)
      const eventType = await eventTypeFactory.create()

      const result = await service.create({
        eventTypeId: eventType.id,
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
      const eventTypeFactory = new EventTypeFactory(TestDataSource)
      const eventType = await eventTypeFactory.create()

      await expect(
        service.create({
          eventTypeId: eventType.id,
          contractId: event.contractId,
          name: 'Another Event',
          key: 'duplicate-key',
        }),
      ).rejects.toEqual(
        new ConflictException(EXCEPTION_RESPONSE.EVENT_KEY_ALREADY_EXISTS),
      );
    });

    it('should throw ConflictException when contract already has an event', async () => {
      const existing = await eventFactory.create({ key: 'existing-for-contract' });
      const eventTypeFactory = new EventTypeFactory(TestDataSource)
      const eventType = await eventTypeFactory.create()

      await expect(
        service.create({
          eventTypeId: eventType.id,
          contractId: existing.contractId,
          name: 'Second Event',
          key: 'another-unique-key',
        }),
      ).rejects.toEqual(
        new ConflictException(
          EXCEPTION_RESPONSE.EVENT_CONTRACT_ALREADY_HAS_EVENT,
        ),
      );
    });

    it('should persist optional metadata and return it in the response', async () => {
      const contractFactory = new ContractFactory(TestDataSource);
      const contract = await contractFactory.create();
      const serviceStartsAt = new Date('2026-06-01T18:00:00.000Z');
      const serviceEndsAt = new Date('2026-06-01T23:00:00.000Z');
      const eventTypeFactory = new EventTypeFactory(TestDataSource)
      const eventType = await eventTypeFactory.create()

      const result = await service.create({
        contractId: contract.id,
        name: 'Wedding',
        key: 'unique-key-metadata-001',
        eventTypeId: eventType.id,
        honoreesNames: 'Ana y Luis',
        albumPhrase: 'Para siempre',
        venueName: 'Salón Jardín',
        serviceLocationUrl: 'https://maps.example.com/place/abc',
        serviceStartsAt,
        serviceEndsAt,
        delegateName: 'María Pérez',
      });

      expect(result.eventTypeId).toBe(eventType.id);
      expect(result.honoreesNames).toBe('Ana y Luis');
      expect(result.albumPhrase).toBe('Para siempre');
      expect(result.venueName).toBe('Salón Jardín');
      expect(result.serviceLocationUrl).toBe('https://maps.example.com/place/abc');
      expect(result.delegateName).toBe('María Pérez');
      expect(result.serviceStartsAt?.getTime()).toBe(serviceStartsAt.getTime());
      expect(result.serviceEndsAt?.getTime()).toBe(serviceEndsAt.getTime());
    });

    it('should throw BadRequestException when serviceEndsAt is not after serviceStartsAt', async () => {
      const contractFactory = new ContractFactory(TestDataSource);
      const contract = await contractFactory.create();
      const eventTypeFactory = new EventTypeFactory(TestDataSource)
      const eventType = await eventTypeFactory.create()

      await expect(
        service.create({
          eventTypeId: eventType.id,
          contractId: contract.id,
          name: 'Bad window',
          key: 'unique-key-bad-window',
          serviceStartsAt: new Date('2026-06-01T18:00:00.000Z'),
          serviceEndsAt: new Date('2026-06-01T12:00:00.000Z'),
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
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

  describe('list', () => {
    it('should return an empty array when no events exist', async () => {
      const result = await service.list();

      expect(result).toEqual([]);
    });

    it('should return all events ordered by createdAt DESC', async () => {
      const event1 = await eventFactory.create({ key: 'list-event-001' });
      const event2 = await eventFactory.create({ key: 'list-event-002' });

      const result = await service.list();

      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result[0].id).toBe(event2.id);
      expect(result[1].id).toBe(event1.id);
    });

    it('should return EventResponseDto instances with expected properties', async () => {
      await eventFactory.create({ key: 'list-event-dto-check' });

      const result = await service.list();

      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('key');
      expect(result[0]).toHaveProperty('token');
      expect(result[0]).toHaveProperty('createdAt');
    });
  });

  describe('update', () => {
    it('should update event name and return updated response', async () => {
      const event = await eventFactory.create({ key: 'update-name-001' });

      const result = await service.update(event.id, { name: 'Updated Name' });

      expect(result.id).toBe(event.id);
      expect(result.name).toBe('Updated Name');
    });

    it('should update multiple optional fields', async () => {
      const event = await eventFactory.create({ key: 'update-multi-001' });
      const eventTypeFactory = new EventTypeFactory(TestDataSource)
      const eventType = await eventTypeFactory.create()

      const result = await service.update(event.id, {
        eventTypeId: eventType.id,
        honoreesNames: 'Sofía',
        albumPhrase: 'Mis XV',
        venueName: 'Salón Real',
        delegateName: 'Mamá de Sofía',
      });

      expect(result.eventTypeId).toBe(eventType.id);
      expect(result.honoreesNames).toBe('Sofía');
      expect(result.albumPhrase).toBe('Mis XV');
      expect(result.venueName).toBe('Salón Real');
      expect(result.delegateName).toBe('Mamá de Sofía');
    });

    it('should update service time window', async () => {
      const event = await eventFactory.create({ key: 'update-time-001' });
      const newStart = new Date('2026-08-01T16:00:00.000Z');
      const newEnd = new Date('2026-08-01T22:00:00.000Z');

      const result = await service.update(event.id, {
        serviceStartsAt: newStart,
        serviceEndsAt: newEnd,
      });

      expect(result.serviceStartsAt?.getTime()).toBe(newStart.getTime());
      expect(result.serviceEndsAt?.getTime()).toBe(newEnd.getTime());
    });

    it('should throw NotFoundException when event does not exist', async () => {
      await expect(
        service.update(999999, { name: 'Does not matter' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw BadRequestException when serviceEndsAt is before serviceStartsAt', async () => {
      const event = await eventFactory.create({ key: 'update-bad-window-001' });

      await expect(
        service.update(event.id, {
          serviceStartsAt: new Date('2026-08-01T22:00:00.000Z'),
          serviceEndsAt: new Date('2026-08-01T16:00:00.000Z'),
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw BadRequestException when new serviceEndsAt conflicts with existing serviceStartsAt', async () => {
      const event = await eventFactory.create({
        key: 'update-partial-window-001',
        serviceStartsAt: new Date('2026-08-01T18:00:00.000Z'),
        serviceEndsAt: new Date('2026-08-01T23:00:00.000Z'),
      });

      await expect(
        service.update(event.id, {
          serviceEndsAt: new Date('2026-08-01T12:00:00.000Z'),
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should not modify fields that are not in the dto', async () => {
      const event = await eventFactory.create({
        key: 'update-preserve-001',
        name: 'Original Name',
        description: 'Original Description',
      });

      const result = await service.update(event.id, { name: 'New Name' });

      expect(result.name).toBe('New Name');
      expect(result.description).toBe('Original Description');
      expect(result.key).toBe('update-preserve-001');
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
