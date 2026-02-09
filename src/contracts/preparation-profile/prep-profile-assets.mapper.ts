import type { PrepProfileAssetsMode } from './dto/prep-profile-public.query.dto';

import { PREP_PROFILE_QUESTION_BY_ID } from './prep-profile.questions';

type AssetLike = { path: string; mime: string; assetId?: number; url?: string };

function isAssetLike(value: unknown): value is AssetLike {
  if (typeof value !== 'object' || value == null || Array.isArray(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return typeof record.path === 'string' && typeof record.mime === 'string';
}

function isAssetArrayLike(value: unknown): value is AssetLike[] {
  return Array.isArray(value) && value.every((v) => isAssetLike(v));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null && !Array.isArray(value);
}

function mapAnyNestedAssetsToUrls(input: {
  value: unknown;
  mode: PrepProfileAssetsMode;
  getPublicUrl: (path: string) => string;
  getSignedUrl: (path: string) => Promise<string>;
  signedTasks: Array<Promise<void>>;
}): unknown {
  const { value, mode, getPublicUrl, getSignedUrl, signedTasks } = input;

  if (isAssetLike(value)) {
    const next: AssetLike = { ...value };
    if (mode === 'public') {
      next.url = getPublicUrl(next.path);
    } else {
      signedTasks.push(
        getSignedUrl(next.path).then((url) => {
          next.url = url;
        }),
      );
    }
    return next;
  }

  if (Array.isArray(value)) {
    return value.map((v) =>
      mapAnyNestedAssetsToUrls({
        value: v,
        mode,
        getPublicUrl,
        getSignedUrl,
        signedTasks,
      }),
    );
  }

  if (isPlainObject(value)) {
    const next: Record<string, unknown> = { ...value };
    for (const [k, v] of Object.entries(next)) {
      next[k] = mapAnyNestedAssetsToUrls({
        value: v,
        mode,
        getPublicUrl,
        getSignedUrl,
        signedTasks,
      });
    }
    return next;
  }

  return value;
}

export async function mapPrepProfileAnswersAssetsToUrls(input: {
  answers: Record<string, unknown>;
  mode: PrepProfileAssetsMode;
  getPublicUrl: (path: string) => string;
  getSignedUrl: (path: string) => Promise<string>;
}): Promise<Record<string, unknown>> {
  if (input.mode === 'none') {
    return input.answers;
  }

  const mapped: Record<string, unknown> = { ...input.answers };

  const signedTasks: Array<Promise<void>> = [];

  for (const [questionId, value] of Object.entries(input.answers)) {
    const question = (PREP_PROFILE_QUESTION_BY_ID as Record<
      string,
      { type: string } | undefined
    >)[questionId];
    if (!question) {
      continue;
    }

    if (question.type === 'asset') {
      if (!isAssetLike(value)) {
        continue;
      }
      mapped[questionId] = mapAnyNestedAssetsToUrls({
        value,
        mode: input.mode,
        getPublicUrl: input.getPublicUrl,
        getSignedUrl: input.getSignedUrl,
        signedTasks,
      });
      continue;
    }

    if (question.type === 'asset_array') {
      if (!isAssetArrayLike(value)) {
        continue;
      }
      mapped[questionId] = mapAnyNestedAssetsToUrls({
        value,
        mode: input.mode,
        getPublicUrl: input.getPublicUrl,
        getSignedUrl: input.getSignedUrl,
        signedTasks,
      });
      continue;
    }

    if (question.type === 'object') {
      mapped[questionId] = mapAnyNestedAssetsToUrls({
        value,
        mode: input.mode,
        getPublicUrl: input.getPublicUrl,
        getSignedUrl: input.getSignedUrl,
        signedTasks,
      });
      continue;
    }
  }

  if (signedTasks.length > 0) {
    await Promise.all(signedTasks);
  }

  return mapped;
}

