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
  action: string;
  prevState: string; // シリアライズされた状態
};

/**
 * useEmbedState 用のコンテキスト型
 */
export type EmbedStateContext = {
  /** instance ID カウンター（グローバル採番用） */
  __embedStateInstanceCounter?: number;

  /** action名 → reducer 登録情報 */
  __embedStateReducers?: Map<string, ReducerEntry>;

  /** クリックされた customId の情報（Message Component Interaction 時のみ） */
  __embedStateTriggered?: TriggeredEmbedState;

  /** Message Component Interaction（reducer 実行時に使用） */
  __embedStateInteraction?: APIMessageComponentInteraction;

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

/**
 * reducer をコンテキストに登録
 *
 * @param context - コンテキスト
 * @param reducers - reducer 関数のマップ
 * @param serializer - シリアライザー
 */
export const registerReducer = <T>(
  context: EmbedStateContext,
  reducers: Record<string, EmbedStateReducer<T>>,
  serializer: Serializer<T>,
): void => {
  if (!context.__embedStateReducers) {
    context.__embedStateReducers = new Map();
  }

  // 各action名をキーとして登録（後勝ち）
  for (const actionName of Object.keys(reducers)) {
    if (context.__embedStateReducers.has(actionName)) {
      console.warn(`[useEmbedState] Action "${actionName}" is already registered. Overwriting.`);
    }
    context.__embedStateReducers.set(actionName, {
      reducers: { [actionName]: reducers[actionName] } as Record<
        string,
        EmbedStateReducer<unknown>
      >,
      serializer: serializer as Serializer<unknown>,
    });
  }
};
