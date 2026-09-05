import {
  EXCLUDED_TABLES,
  INCLUDED_TABLES,
  assertLocalTarget,
  buildRowFilter,
  compareSchemaColumns,
  sanitizeRow,
} from './production-seed';

describe('production seed policy', () => {
  const context = {
    passwordHash: 'local-password-hash',
    dateShiftDays: 10,
  };

  it('includes the complete catalog, contract, and event relationship graph', () => {
    expect(INCLUDED_TABLES).toEqual(
      expect.arrayContaining([
        'users',
        'brands',
        'products',
        'packages',
        'package_products',
        'terms',
        'package_terms',
        'brand_terms',
        'extras',
        'promotions',
        'promotion_packages',
        'slots',
        'contracts',
        'contract_packages',
        'contract_extras',
        'contract_promotions',
        'contract_slots',
        'event_types',
        'event_service_types',
        'event_phrases',
        'event_themes',
        'events',
      ]),
    );
  });

  it('excludes authentication, media, analytics, and free-form operational data', () => {
    expect(EXCLUDED_TABLES).toEqual(
      expect.arrayContaining([
        'tokens',
        'sessions',
        'photos',
        'event_analytics',
        'notes',
        'payments',
        'carousels',
        'contract_preparation_profiles',
      ]),
    );

    for (const table of EXCLUDED_TABLES) {
      expect(INCLUDED_TABLES).not.toContain(table);
    }
  });

  it('preserves visual theme tokens while removing external theme images', () => {
    const tokens = { primary: '#ffffff', surface: '#111111' };

    expect(
      sanitizeRow(
        'event_themes',
        {
          id: 7,
          key: 'dark',
          tokens,
          images: { splashLogo: { url: 'https://prod.example/logo.png' } },
        },
        context,
      ),
    ).toEqual({ id: 7, key: 'dark', tokens, images: null });
  });

  it('does not invent the optional images column on an older aligned schema', () => {
    const row = { id: 7, key: 'dark', tokens: { primary: '#ffffff' } };

    expect(sanitizeRow('event_themes', row, context)).toEqual(row);
  });

  it('deterministically anonymizes users and replaces credentials', () => {
    const row = {
      id: 42,
      first_name: 'Real',
      last_name: 'Person',
      email: 'real@example.com',
      phone: '+5215555555555',
      password: 'production-hash',
    };

    const first = sanitizeRow('users', row, context);
    const second = sanitizeRow('users', row, context);

    expect(first).toEqual(second);
    expect(first).toMatchObject({
      first_name: 'Local',
      last_name: 'User 42',
      email: 'user-42@example.test',
      password: 'local-password-hash',
    });
    expect(first.phone).not.toBe(row.phone);
  });

  it('anonymizes event identities, secrets, locations, and external print data', () => {
    const sanitized = sanitizeRow(
      'events',
      {
        id: 9,
        key: 'production-key',
        token: '5cdf952f-0957-482e-a806-d5f1795b4b4d',
        honorees_names: 'Real Couple',
        album_phrase: 'Private phrase',
        venue_name: 'Real Venue',
        service_location_url: 'https://maps.example/private',
        service_starts_at: '2026-01-10T12:00:00.000Z',
        service_ends_at: '2026-01-10T14:00:00.000Z',
        delegate_name: 'Real Delegate',
        print_templates: [{ url: 'https://prod.example/template.png' }],
      },
      context,
    );

    expect(sanitized).toMatchObject({
      key: 'local-event-9',
      honorees_names: 'Local Honorees 9',
      album_phrase: null,
      venue_name: 'Local Venue 9',
      service_location_url: null,
      delegate_name: 'Local Delegate 9',
      print_templates: null,
      service_starts_at: new Date('2026-01-20T12:00:00.000Z'),
      service_ends_at: new Date('2026-01-20T14:00:00.000Z'),
    });
    expect(sanitized.token).not.toBe('5cdf952f-0957-482e-a806-d5f1795b4b4d');
  });

  it('keeps null PII fields null instead of manufacturing identities', () => {
    expect(
      sanitizeRow(
        'contracts',
        {
          id: 3,
          client_name: null,
          client_email: null,
          client_phone: null,
          token: 'production-token',
          sku: 'PROD-3',
        },
        context,
      ),
    ).toMatchObject({
      client_name: null,
      client_email: null,
      client_phone: null,
      token: expect.not.stringMatching('production-token'),
      sku: 'LOCAL-3',
    });
  });

  it('shifts slot dates using the same global offset used by events', () => {
    expect(
      sanitizeRow('slots', { id: 1, event_date: '2026-02-01' }, context),
    ).toMatchObject({ event_date: '2026-02-11' });
  });

  it('shifts PostgreSQL date objects without changing their local calendar day', () => {
    const postgresDate = new Date(2026, 2, 7);

    expect(
      sanitizeRow('slots', { id: 1, event_date: postgresDate }, context),
    ).toMatchObject({ event_date: '2026-03-17' });
  });

  it('rejects production stages and non-loopback targets', () => {
    expect(() =>
      assertLocalTarget({
        stage: 'production',
        host: 'localhost',
        database: 'bookandsign_dev',
      }),
    ).toThrow('production');

    expect(() =>
      assertLocalTarget({
        stage: 'local',
        host: 'db.example.com',
        database: 'bookandsign_dev',
      }),
    ).toThrow('loopback');

    expect(() =>
      assertLocalTarget({
        stage: 'local',
        host: 'localhost',
        database: 'bookandsign_production',
      }),
    ).toThrow('production-like');
  });

  it('accepts a local development target', () => {
    expect(() =>
      assertLocalTarget({
        stage: 'local',
        host: '127.0.0.1',
        database: 'bookandsign_dev',
      }),
    ).not.toThrow();
  });

  it('limits contracts and their dependent graph to the selected sample', () => {
    expect(buildRowFilter('contracts', [10, 11], [20])).toEqual({
      sql: '"id" = ANY($1::int[])',
      parameters: [[10, 11]],
    });
    expect(buildRowFilter('contract_packages', [10, 11], [20])).toEqual({
      sql: '"contract_id" = ANY($1::int[])',
      parameters: [[10, 11]],
    });
    expect(buildRowFilter('slots', [10, 11], [20])).toEqual({
      sql: '"id" = ANY($1::int[])',
      parameters: [[20]],
    });
    expect(buildRowFilter('brands', [10, 11], [20])).toEqual({
      sql: 'TRUE',
      parameters: [],
    });
  });

  it('treats identical schema columns in different physical order as compatible', () => {
    expect(
      compareSchemaColumns(
        ['id', 'user_id', 'brand_id', 'status'],
        ['id', 'status', 'user_id', 'brand_id'],
      ),
    ).toEqual({ sourceOnly: [], targetOnly: [] });
  });

  it('reports the exact source-only and target-only schema columns', () => {
    expect(
      compareSchemaColumns(
        ['id', 'user_id', 'legacy_reference'],
        ['id', 'user_id', 'booking_id'],
      ),
    ).toEqual({
      sourceOnly: ['legacy_reference'],
      targetOnly: ['booking_id'],
    });
  });
});
