import { getCurrentContext } from "@disact/engine";
import type { APIMessageComponentInteraction } from "discord-api-types/v10";
import { generateCustomId, isDisactCustomId, parseCustomId } from "../state/customId";
import { createDefaultSerializer, type Serializer } from "../state/serializer";
import {
  type EmbedStateContext,
  type EmbedStateReducer,
  generateInstanceId,
} from "../state/embedStateContext";
import type { InteractionCallbacksContext } from "./useInteraction";
import { useInteraction } from "./useInteraction";
import { useRerender } from "./useRerender";

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
  const context = getCurrentContext<EmbedStateContext & InteractionCallbacksContext>();
  const rerender = useRerender();

  // シリアライザーを取得
  const serializer: Serializer<T> =
    options?.serialize && options?.deserialize
      ? { serialize: options.serialize, deserialize: options.deserialize }
      : createDefaultSerializer<T>();

  // instanceId を生成（レンダリングごとに安定）
  const instanceId = generateInstanceId(context);

  // 計算済みの状態があれば使用、なければ初期値
  const computedStates = context.__embedStateComputedStates;
  const currentState: T = (computedStates?.get(instanceId) as T) ?? initialValue;

  // useInteraction でコールバックを登録
  useInteraction<APIMessageComponentInteraction>((interaction) => {
    const customId = interaction.data.custom_id;
    if (!isDisactCustomId(customId)) return;

    const parsed = parseCustomId(customId);
    if (!parsed) return;

    // instanceId でこのフックのアクションか判定
    if (parsed.instanceId !== instanceId) return;

    const reducer = reducers[parsed.action];
    if (!reducer) return;

    const prevState = serializer.deserialize(parsed.prevState);
    const nextState = reducer(prevState, interaction);

    // 計算された状態を保存
    if (!context.__embedStateComputedStates) {
      context.__embedStateComputedStates = new Map();
    }
    context.__embedStateComputedStates.set(instanceId, nextState);

    // 再レンダリングをトリガー
    rerender();
  });

  // Actions を生成（関数形式）
  const actions = {} as Actions<R>;
  const serializedState = serializer.serialize(currentState);

  for (const actionName of Object.keys(reducers)) {
    (actions as Record<string, () => string>)[actionName] = () => {
      return generateCustomId(actionName, instanceId, serializedState);
    };
  }

  return [currentState, actions];
};
