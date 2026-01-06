import { Test, TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';

import { AppModule } from '../src/app.module';
import { SLOT_PERIOD } from '../src/slots/types/slot-period.types';

describe('Contracts (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const email = `e2e_${Date.now()}@test.com`;
    const password = 'Password123!';

    await request(app.getHttpServer()).post('/auth/signup').send({
      role: 'user',
      firstName: 'E2E',
      lastName: 'User',
      email,
      password,
      phone: `555${Date.now()}`,
    });

    const loginRes = await request(app.getHttpServer()).post('/auth/login').send({
      email,
      password,
    });
    accessToken = loginRes.body.accessAndRefreshToken.accessToken;
  });

  afterEach(async () => {
    await app.close();
  });

  it('flow: create contract -> add item -> add payment -> get detail', async () => {
    const brandRes = await request(app.getHttpServer())
      .post('/brands')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        key: 'Lusso Recepciones',
        name: `Brand ${Date.now()}`,
        theme: { primaryColor: '#000000', secondaryColor: '#ffffff' },
        logoUrl: null,
        phoneNumber: null,
        email: null,
      })
      .expect(201);
    const brandId = brandRes.body.id;

    const packageRes = await request(app.getHttpServer())
      .post('/packages')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        brandId,
        code: `PKG-${Date.now()}`,
        name: 'Package Test',
        description: null,
        basePrice: 100,
        discount: 0,
        status: 'active',
      })
      .expect(201);
    const packageId = packageRes.body.id;
    const packageBasePrice = packageRes.body.basePrice;

    const hold1 = await request(app.getHttpServer())
      .post('/slots/hold')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        eventDate: '2026-01-15',
        period: SLOT_PERIOD.MORNING,
        leadName: 'Lead',
        leadEmail: 'lead@test.com',
        leadPhone: '2221101495',
      })
      .expect(201);

    const contractRes = await request(app.getHttpServer())
      .post('/contracts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        brandId,
        slotIds: [hold1.body.id],
        clientName: 'Client',
        clientPhone: '2221101495',
        notes: 'Promo',
      })
      .expect(201);

    const contractId = contractRes.body.contract.id;

    await request(app.getHttpServer())
      .post(`/contracts/${contractId}/items`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ packageId, quantity: 1 })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/contracts/${contractId}/payments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        amount: packageBasePrice,
        method: 'cash',
        receivedAt: new Date().toISOString(),
      })
      .expect(201);

    const detail = await request(app.getHttpServer())
      .get(`/contracts/${contractId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(detail.body.contract.id).toBe(contractId);
    expect(detail.body.contract.status).toBe('closed');
    expect(detail.body.items).toHaveLength(1);
    expect(detail.body.payments).toHaveLength(1);
  });
});


