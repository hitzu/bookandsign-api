export type DtoClass<TDto = unknown> = new (...args: unknown[]) => TDto;

export const USE_DTO_KEY = Symbol('use_dto');

/**
 * Links an entity class to its DTO class via metadata.
 *
 * This is intentionally lightweight: it enables consistent association between
 * entities and DTOs (per project guidelines), and can be leveraged later by
 * serializers/interceptors/helpers if desired.
 */
export function UseDto<TDto>(dtoClass: DtoClass<TDto>): ClassDecorator {
  return (target) => {
    const reflect = Reflect as unknown as {
      defineMetadata?: (key: unknown, value: unknown, target: unknown) => void;
    };

    if (typeof reflect?.defineMetadata === 'function') {
      reflect.defineMetadata(USE_DTO_KEY, dtoClass, target);
      return;
    }

    // Fallback when reflect-metadata isn't available (keeps runtime safe).
    Object.defineProperty(target, USE_DTO_KEY, {
      configurable: false,
      enumerable: false,
      writable: false,
      value: dtoClass,
    });
  };
}

export function getDtoClass<TDto>(target: unknown): DtoClass<TDto> | undefined {
  const reflect = Reflect as unknown as {
    getMetadata?: (key: unknown, target: unknown) => unknown;
  };

  if (typeof reflect?.getMetadata === 'function') {
    return reflect.getMetadata(USE_DTO_KEY, target) as
      | DtoClass<TDto>
      | undefined;
  }

  const maybe = target as Record<PropertyKey, unknown>;
  return maybe?.[USE_DTO_KEY] as DtoClass<TDto> | undefined;
}
