/**
 * CustomId管理ユーティリティ
 * フォーマット: dsct|{uniqueId}|{name}|{currentValue}|{nextValue}
 */

const MAGIC = "dsct";
const SEPARATOR = "|";

/**
 * パースされたcustomIdの構造
 */
export type ParsedCustomId = {
  uniqueId: string;
  name: string;
  current: string;
  next: string;
};

/**
 * customIdをパースする
 * DisactのcustomIdでない場合、またはフォーマットが不正な場合はnullを返す
 */
export const parseCustomId = (customId: string): ParsedCustomId | null => {
  const parts = customId.split(SEPARATOR);

  // フォーマット検証: 必ず5つの部品が必要
  if (parts.length !== 5) {
    return null;
  }

  // parts.length === 5 を確認済みのため、型アサーションは安全
  const [magic, uniqueId, name, current, next] = parts as [string, string, string, string, string];

  // マジックナンバー検証
  if (magic !== MAGIC) {
    return null;
  }

  // 各パーツが空文字列でないことを検証
  if (uniqueId === "" || name === "" || current === "" || next === "") {
    return null;
  }

  return { uniqueId, name, current, next };
};

/**
 * customIdを生成する
 */
export const generateCustomId = (
  uniqueId: string,
  name: string,
  current: string,
  next: string,
): string => {
  return [MAGIC, uniqueId, name, current, next].join(SEPARATOR);
};

/**
 * 値のシリアライザー/デシリアライザー
 */
export type Serializer<T> = {
  serialize: (value: T) => string;
  deserialize: (str: string) => T;
};

/**
 * デフォルトシリアライザー（プリミティブ型用）
 */
export const defaultSerializer: Serializer<unknown> = {
  serialize: (value: unknown): string => {
    if (value == null) {
      return String(value);
    }
    if (typeof value === "string") {
      return value;
    }
    return JSON.stringify(value);
  },
  deserialize: (str: string): unknown => {
    // null/undefinedの文字列表現をパース
    if (str === "null") return null;
    if (str === "undefined") return undefined;

    // JSONとしてパースを試みる
    try {
      return JSON.parse(str);
    } catch {
      // パースに失敗したら文字列として返す
      return str;
    }
  },
};
