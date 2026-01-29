export type Serializer<T> = {
  serialize: (value: T) => string;
  deserialize: (str: string) => T;
};

/**
 * デフォルトシリアライザー（JSON.stringify/parse）
 *
 * @returns JSON ベースのシリアライザー
 */
export const createDefaultSerializer = <T>(): Serializer<T> => ({
  serialize: (value: T): string => JSON.stringify(value),
  deserialize: (str: string): T => JSON.parse(str) as T,
});
