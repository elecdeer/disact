import { getCurrentContext } from "@disact/engine";
import type { APIMessageComponentInteraction } from "discord-api-types/v10";
import { generateCustomId } from "../state/customId";
import { createDefaultSerializer, type Serializer } from "../state/serializer";
import {
  type EmbedStateContext,
  type EmbedStateReducer,
  generateInstanceId,
  registerReducer,
} from "../state/embedStateContext";

/**
 * Reducers の型定義
 */
export type Reducers<T> = Record<string, EmbedStateReducer<T>>;

/**
 * Actions の型定義（各キーに対応する customId 生成関数）
 */
export type Actions<R> = {
  [K in keyof R]: () => string;
};

/**
 * useEmbedState のオプション
 */
export type UseEmbedStateOptions<T> = {
  serialize?: (value: T) => string;
  deserialize?: (str: string) => T;
};

/**
 * customId に状態を埋め込む状態管理フック
 *
 * @param initialValue - 初期値
 * @param reducers - アクション名 → reducer 関数のマップ
 * @param options - カスタムシリアライザー
 * @returns [現在の状態, アクション名 → customId 生成関数のマップ]
 *
 * @example
 * ```tsx
 * const [count, actions] = useEmbedState(0, {
 *   increment: (prev, interaction) => prev + 1,
 *   decrement: (prev, interaction) => prev - 1,
 * });
 *
 * return (
 *   <ActionRow>
 *     <Button customId={actions.increment()} style="primary">+1</Button>
 *     <Button customId={actions.decrement()} style="danger">-1</Button>
 *   </ActionRow>
 * );
 * ```
 */
export const useEmbedState = <T, R extends Reducers<T>>(
  initialValue: T,
  reducers: R,
  options?: UseEmbedStateOptions<T>,
): [T, Actions<R>] => {
  const context = getCurrentContext<EmbedStateContext>();

  // シリアライザーを取得
  const serializer: Serializer<T> =
    options?.serialize && options?.deserialize
      ? { serialize: options.serialize, deserialize: options.deserialize }
      : createDefaultSerializer<T>();

  // reducer をコンテキストに登録
  registerReducer(context, reducers, serializer);

  // 現在の状態を決定
  let currentState: T;

  const triggered = context.__embedStateTriggered;
  if (triggered) {
    // このアクションがトリガーされたか確認
    const reducer = reducers[triggered.action];

    if (reducer) {
      // この useEmbedState のアクションがトリガーされた場合、reducer を実行
      const prevState = serializer.deserialize(triggered.prevState);

      // interaction を取得（context に設定されている必要がある）
      const interaction = context.__embedStateInteraction as
        | APIMessageComponentInteraction
        | undefined;
      if (!interaction) {
        throw new Error("useEmbedState: interaction is required when triggered");
      }

      currentState = reducer(prevState, interaction);
    } else {
      // このフックのアクションではない場合は初期値を使用
      currentState = initialValue;
    }
  } else {
    // トリガーされていない場合は初期値を使用
    currentState = initialValue;
  }

  // Actions を生成（関数形式）
  const actions = {} as Actions<R>;
  const serializedState = serializer.serialize(currentState);

  for (const actionName of Object.keys(reducers)) {
    (actions as Record<string, () => string>)[actionName] = () => {
      const instanceId = generateInstanceId(context);
      return generateCustomId(actionName, instanceId, serializedState);
    };
  }

  return [currentState, actions];
};
