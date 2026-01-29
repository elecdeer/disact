const MAGIC_PREFIX = "DSCT";
const SEPARATOR = "|";

export type ParsedCustomId = {
  hookId: string;
  action: string;
  prevState: string; // シリアライズされた状態（デシリアライズは呼び出し側で行う）
};

/**
 * Disact 管理の customId かどうかを判定
 *
 * @param customId - 検証する customId
 * @returns Disact 管理の customId の場合 true
 */
export const isDisactCustomId = (customId: string): boolean => {
  return customId.startsWith(MAGIC_PREFIX + SEPARATOR);
};

/**
 * customId をパース
 *
 * @param customId - パースする customId
 * @returns パース結果、または非 Disact customId の場合は null
 */
export const parseCustomId = (customId: string): ParsedCustomId | null => {
  if (!isDisactCustomId(customId)) {
    return null;
  }

  // DSCT|hookId|action|prevState
  // prevState に | が含まれる可能性があるため、split の limit は使わない
  const withoutPrefix = customId.slice(MAGIC_PREFIX.length + SEPARATOR.length);
  const firstSep = withoutPrefix.indexOf(SEPARATOR);
  const secondSep = withoutPrefix.indexOf(SEPARATOR, firstSep + 1);

  if (firstSep === -1 || secondSep === -1) {
    return null;
  }

  const hookId = withoutPrefix.slice(0, firstSep);
  const action = withoutPrefix.slice(firstSep + 1, secondSep);
  const prevState = withoutPrefix.slice(secondSep + 1);

  return { hookId, action, prevState };
};

/**
 * customId を生成
 *
 * @param hookId - フック ID
 * @param action - アクション名
 * @param serializedPrevState - シリアライズされた前の状態
 * @returns 生成された customId
 * @throws 100 文字を超える場合
 */
export const generateCustomId = (
  hookId: string,
  action: string,
  serializedPrevState: string,
): string => {
  const customId = [MAGIC_PREFIX, hookId, action, serializedPrevState].join(SEPARATOR);

  if (customId.length > 100) {
    throw new Error(
      `customId exceeds 100 character limit (${customId.length} chars). ` +
        `Consider using a custom serializer to compress the state.`,
    );
  }

  return customId;
};
