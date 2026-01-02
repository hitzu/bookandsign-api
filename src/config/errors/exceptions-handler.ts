import { QueryFailedError } from 'typeorm';

export const isUniqueViolation = (error: unknown): boolean => {
  if (!(error instanceof QueryFailedError)) {
    return false;
  }
  const driverError = (error as unknown as { driverError?: { code?: string } })
    .driverError;
  return driverError?.code === '23505';
};
