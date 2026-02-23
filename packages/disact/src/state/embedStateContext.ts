import type { APIMessageComponentInteraction } from "discord-api-types/v10";

/**
 * useEmbedState の reducer 関数型
 */
export type EmbedStateReducer<T> = (prev: T, interaction: APIMessageComponentInteraction) => T;

/**
 * useEmbedState 用のコンテキスト型
 */
export type EmbedStateContext = {
  /** instance ID カウンター（グローバル採番用） */
  __embedStateInstanceCounter?: number;

  /** 計算済みの状態（instanceId → state） */
  __embedStateComputedStates?: Map<string, unknown>;

  [key: string]: unknown;
};

/**
 * instance ID を生成（グローバルカウンター）
 *
 * @param context - コンテキスト
 * @returns 生成された instance ID
 */
export const generateInstanceId = (context: EmbedStateContext): string => {
  if (context.__embedStateInstanceCounter === undefined) {
    context.__embedStateInstanceCounter = 0;
  }
  const id = context.__embedStateInstanceCounter;
  context.__embedStateInstanceCounter++;
  return String(id);
};
