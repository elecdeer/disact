import type { Simplify } from "type-fest";

type OmitUndefinedProperties<T> = {
  [K in keyof T as undefined extends T[K] ? never : [T[K]] extends [undefined] ? never : K]: T[K];
} & {
  [K in keyof T as undefined extends T[K]
    ? [T[K]] extends [undefined]
      ? never
      : K
    : never]?: NonNullable<T[K]>;
};

/**
 * オブジェクトからundefinedの値を持つプロパティを除外する
 * exactOptionalPropertyTypes対応のため
 */
export function removeUndefined<T extends object>(obj: T): Simplify<OmitUndefinedProperties<T>> {
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined)) as Simplify<
    OmitUndefinedProperties<T>
  >;
}
