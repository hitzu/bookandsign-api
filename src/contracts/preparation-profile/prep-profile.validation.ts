import type { PrepProfileQuestionDefinition } from './prep-profile.questions';

import { UnprocessableEntityException } from '@nestjs/common';

import { PREP_PROFILE_QUESTION_BY_ID, isPrepAssetMetadata } from './prep-profile.questions';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isDateString(value: unknown): value is string {
  if (!isNonEmptyString(value)) {
    return false;
  }
  const m = value.match(/^\d{4}-\d{2}-\d{2}$/);
  if (!m) {
    return false;
  }
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
}

function isTimeString(value: unknown): value is string {
  if (!isNonEmptyString(value)) {
    return false;
  }
  const m = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) {
    return false;
  }
  const hours = Number(m[1]);
  const minutes = Number(m[2]);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return false;
  }
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null && !Array.isArray(value);
}

function validateValueByType(
  question: PrepProfileQuestionDefinition,
  value: unknown,
): void {
  switch (question.type) {
    case 'string':
    case 'textarea':
      if (!isNonEmptyString(value)) {
        throw new UnprocessableEntityException(
          `Invalid value for ${question.id}: expected non-empty string`,
        );
      }
      return;
    case 'radio': {
      if (!isNonEmptyString(value)) {
        throw new UnprocessableEntityException(
          `Invalid value for ${question.id}: expected non-empty string`,
        );
      }
      if (
        Array.isArray(question.options) &&
        question.options.length > 0 &&
        !question.options.some((opt) => opt.value === value)
      ) {
        throw new UnprocessableEntityException(
          `Invalid value for ${question.id}: expected one of the allowed options`,
        );
      }
      return;
    }
    case 'date':
      if (!isDateString(value)) {
        throw new UnprocessableEntityException(
          `Invalid value for ${question.id}: expected date string`,
        );
      }
      return;
    case 'time':
      if (!isTimeString(value)) {
        throw new UnprocessableEntityException(
          `Invalid value for ${question.id}: expected time string (HH:mm)`,
        );
      }
      return;
    case 'boolean':
      if (typeof value !== 'boolean') {
        throw new UnprocessableEntityException(
          `Invalid value for ${question.id}: expected boolean`,
        );
      }
      return;
    case 'object':
      if (!isPlainObject(value)) {
        throw new UnprocessableEntityException(
          `Invalid value for ${question.id}: expected object`,
        );
      }
      return;
    case 'asset':
      if (!isPrepAssetMetadata(value)) {
        throw new UnprocessableEntityException(
          `Invalid value for ${question.id}: expected asset metadata`,
        );
      }
      return;
    case 'asset_array':
      if (!Array.isArray(value) || value.length === 0) {
        throw new UnprocessableEntityException(
          `Invalid value for ${question.id}: expected non-empty asset array`,
        );
      }
      if (!value.every((v) => isPrepAssetMetadata(v))) {
        throw new UnprocessableEntityException(
          `Invalid value for ${question.id}: expected asset metadata array`,
        );
      }
      return;
    default: {
      const exhaustive: never = question.type;
      void exhaustive;
      return;
    }
  }
}

export function validatePrepProfileAnswer(input: {
  questionId: string;
  value: unknown;
}): void {
  const question = assertPrepProfileQuestionId(input.questionId);

  validateValueByType(question, input.value);
}

export function assertPrepProfileQuestionId(
  questionId: string,
): PrepProfileQuestionDefinition {
  const question = (PREP_PROFILE_QUESTION_BY_ID as Record<
    string,
    PrepProfileQuestionDefinition | undefined
  >)[questionId];
  if (!question) {
    throw new UnprocessableEntityException(`Invalid questionId: ${questionId}`);
  }
  return question;
}

