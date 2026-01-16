import { getCurrentContext } from "@disact/engine";
import { type Serializer, defaultSerializer, generateCustomId } from "./customId";

/**
 * Reducer関数の型定義
 * 状態Tを受け取り、新しい状態Tを返す関数の集合
 */
export type Reducers<T> = Record<string, (curr: T, ...args: unknown[]) => T>;

/**
 * Reducerから生成されるActions型
 */
export type Actions<T, R extends Reducers<T>> = {
  [K in keyof R]: R[K] extends (curr: T) => T
    ? () => string // 引数なしのreducer
    : R[K] extends (curr: T, ...args: infer Args) => T
      ? (...args: Args) => string // 引数ありのreducer
      : never;
};

/**
 * useReducerの状態を保持するContext型
 */
export type ReducerContext = {
  __reducerValues?: Map<string, unknown>;
  __hookCallIndex?: number;
  [key: string]: unknown;
};

/**
 * useReducerのオプション
 */
export type UseReducerOptions<T> = {
  serializer?: Serializer<T>;
};

/**
 * customIdベースの状態管理Hook
 *
 * @param name - 状態の識別子（短命ランタイムで決定的である必要がある）
 * @param initialValue - 初期値（初回レンダリング時のみ使用）
 * @param reducers - 状態を更新するreducer関数の集合
 * @param options - オプション（シリアライザーなど）
 * @returns [現在の値, アクション関数の集合]
 *
 * @example
 * ```tsx
 * function Counter() {
 *   const [count, dispatch] = useReducer("counter", 0, {
 *     increase: (curr: number) => curr + 1,
 *     decrease: (curr: number) => curr - 1,
 *     add: (curr: number, amount: number) => curr + amount,
 *   });
 *
 *   return (
 *     <>
 *       <p>Count: {count}</p>
 *       <button customId={dispatch.increase()}>+1</button>
 *       <button customId={dispatch.add(5)}>+5</button>
 *     </>
 *   );
 * }
 * ```
 */
export const useReducer = <T, R extends Reducers<T>>(
  name: string,
  initialValue: T,
  reducers: R,
  options?: UseReducerOptions<T>,
): [T, Actions<T, R>] => {
  const context = getCurrentContext<ReducerContext>();

  // __hookCallIndexが存在しない場合は初期化
  if (context.__hookCallIndex === undefined) {
    context.__hookCallIndex = 0;
  }

  // 現在のhook呼び出しindexを取得してインクリメント
  const uniqueId = String(context.__hookCallIndex);
  context.__hookCallIndex++;

  // reducerValuesマップが存在しない場合は初期化
  if (!context.__reducerValues) {
    context.__reducerValues = new Map();
  }

  // コンテキストから値を取得、なければinitialValueを使用
  // Mapはunknown型を保持するため、型アサーションが必要
  const currentValue = context.__reducerValues.has(name)
    ? (context.__reducerValues.get(name) as T)
    : initialValue;

  // シリアライザーの取得（デフォルトまたはカスタム）
  // defaultSerializerはunknown型を扱うため、型アサーションが必要
  const serializer = options?.serializer ?? (defaultSerializer as Serializer<T>);

  // アクション関数を生成
  // 空オブジェクトから動的に構築するため、型アサーションが必要
  const actions = {} as Actions<T, R>;

  for (const [actionName, reducer] of Object.entries(reducers)) {
    // 各reducerに対してアクション関数を作成
    // reducersの型情報が実行時に失われるため、型アサーションが必要
    actions[actionName as keyof R] = ((...args: unknown[]) => {
      // reducerを実行して次の値を計算
      const nextValue = reducer(currentValue, ...args);

      // customIdを生成
      const current = serializer.serialize(currentValue);
      const next = serializer.serialize(nextValue);
      return generateCustomId(uniqueId, name, current, next);
    }) as Actions<T, R>[keyof R];
  }

  return [currentValue, actions];
};
