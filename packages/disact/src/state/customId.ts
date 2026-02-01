const MAGIC_PREFIX = "DSCT";
const SEPARATOR = "|";

export type ParsedCustomId = {
  action: string;
  instanceId: string;
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

  // DSCT|action#instanceId|prevState
  // prevState に | が含まれる可能性があるため、split の limit は使わない
  const withoutPrefix = customId.slice(MAGIC_PREFIX.length + SEPARATOR.length);
  const firstSep = withoutPrefix.indexOf(SEPARATOR);

  if (firstSep === -1) {
    return null;
  }

  const actionPart = withoutPrefix.slice(0, firstSep);
  const prevState = withoutPrefix.slice(firstSep + 1);

  // action#instanceId を分割
  const hashIndex = actionPart.indexOf("#");
  if (hashIndex === -1) {
    return null;
  }

  const action = actionPart.slice(0, hashIndex);
  const instanceId = actionPart.slice(hashIndex + 1);

  return { action, instanceId, prevState };
};

/**
 * customId を生成
 *
 * @param action - アクション名
 * @param instanceId - インスタンス ID
 * @param serializedPrevState - シリアライズされた前の状態
 * @returns 生成された customId
 * @throws 100 文字を超える場合
 */
export const generateCustomId = (
  action: string,
  instanceId: string,
  serializedPrevState: string,
): string => {
  const customId = `${MAGIC_PREFIX}${SEPARATOR}${action}#${instanceId}${SEPARATOR}${serializedPrevState}`;

  if (customId.length > 100) {
    throw new Error(
      `customId exceeds 100 character limit (${customId.length} chars). ` +
        `Consider using a custom serializer to compress the state.`,
    );
  }

  return customId;
};
