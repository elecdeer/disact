import type { APIMessageComponentInteraction } from "discord-api-types/v10";
import type { Serializer } from "./serializer";

/**
 * useEmbedState の reducer 関数型
 */
export type EmbedStateReducer<T> = (prev: T, interaction: APIMessageComponentInteraction) => T;

/**
 * reducer 登録情報
 */
export type ReducerEntry<T = unknown> = {
  reducers: Record<string, EmbedStateReducer<T>>;
  serializer: Serializer<T>;
};

/**
 * クリックされた customId の情報
 */
export type TriggeredEmbedState = {
  hookId: string;
  action: string;
  prevState: string; // シリアライズされた状態
};

/**
 * useEmbedState 用のコンテキスト型
 */
export type EmbedStateContext = {
  /** フック呼び出し順カウンター（hookId 生成用） */
  __embedStateIdCounter?: number;

  /** hookId → reducer 登録情報 */
  __embedStateReducers?: Map<string, ReducerEntry>;

  /** クリックされた customId の情報（Message Component Interaction 時のみ） */
  __embedStateTriggered?: TriggeredEmbedState;

  /** Message Component Interaction（reducer 実行時に使用） */
  __embedStateInteraction?: APIMessageComponentInteraction;

  [key: string]: unknown;
};

/**
 * hookId を生成（呼び出し順でインクリメント）
 *
 * @param context - コンテキスト
 * @returns 生成された hookId
 */
export const generateHookId = (context: EmbedStateContext): string => {
  if (context.__embedStateIdCounter === undefined) {
    context.__embedStateIdCounter = 0;
  }
  const id = context.__embedStateIdCounter;
  context.__embedStateIdCounter++;
  return String(id);
};

/**
 * reducer をコンテキストに登録
 *
 * @param context - コンテキスト
 * @param hookId - フック ID
 * @param reducers - reducer 関数のマップ
 * @param serializer - シリアライザー
 */
export const registerReducer = <T>(
  context: EmbedStateContext,
  hookId: string,
  reducers: Record<string, EmbedStateReducer<T>>,
  serializer: Serializer<T>,
): void => {
  if (!context.__embedStateReducers) {
    context.__embedStateReducers = new Map();
  }
  context.__embedStateReducers.set(hookId, {
    reducers: reducers as Record<string, EmbedStateReducer<unknown>>,
    serializer: serializer as Serializer<unknown>,
  });
};
