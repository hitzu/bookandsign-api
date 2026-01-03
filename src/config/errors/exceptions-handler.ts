import { QueryFailedError } from 'typeorm';

/**
 * Detects PostgreSQL unique-violation errors.
 *
 * @param error - Any thrown error object.
 * @returns `true` when the error is a TypeORM `QueryFailedError` with Postgres code `'23505'`; otherwise `false`.
 *
 * Important: this check is Postgres-specific (code `'23505'`) and relies on the `QueryFailedError` driverError shape.
 */
export const isUniqueViolation = (error: unknown): boolean => {
  if (!(error instanceof QueryFailedError)) {
    return false;
  }
  const driverError = (error as unknown as { driverError?: { code?: string } })
    .driverError;
  return driverError?.code === '23505';
};
