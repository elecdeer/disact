/**
 * CustomId管理ユーティリティ
 * フォーマット: dsct|{name}|{currentValue}|{nextValue}
 */

const MAGIC = "dsct";
const SEPARATOR = "|";

/**
 * パースされたcustomIdの構造
 */
export type ParsedCustomId = {
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

  // フォーマット検証: 必ず4つの部品が必要
  if (parts.length !== 4) {
    return null;
  }

  // parts.length === 4 を確認済みのため、型アサーションは安全
  const [magic, name, current, next] = parts as [string, string, string, string];

  // マジックナンバー検証
  if (magic !== MAGIC) {
    return null;
  }

  // 各パーツが空文字列でないことを検証
  if (name === "" || current === "" || next === "") {
    return null;
  }

  return { name, current, next };
};

/**
 * customIdを生成する
 */
export const generateCustomId = (
  name: string,
  current: string,
  next: string,
): string => {
  return [MAGIC, name, current, next].join(SEPARATOR);
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
