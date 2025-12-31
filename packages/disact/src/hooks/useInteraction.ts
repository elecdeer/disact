import { getCurrentContext } from "@disact/engine";

/**
 * Interactionコールバックの型
 */
export type InteractionCallback<T = unknown> = (
  interaction: T,
) => void | Promise<void>;

/**
 * Interactionコールバックを保持するContext型
 */
export type InteractionCallbacksContext<T = unknown> = {
  __interactionCallbacks?: InteractionCallback<T>[];
  [key: string]: unknown;
};

/**
 * レンダリング完了後、commit前に実行されるInteractionコールバックを登録する
 *
 * @param callback - Interactionオブジェクトを受け取るコールバック関数
 * @throws レンダリングコンテキスト外で呼び出された場合
 *
 * @example
 * ```tsx
 * const MyButton = () => {
 *   useInteraction((interaction) => {
 *     console.log('Rendered for:', interaction.id);
 *   });
 *   return <Button customId="my-button">Click</Button>;
 * };
 * ```
 */
export const useInteraction = <T = unknown>(
  callback: InteractionCallback<T>,
): void => {
  const context = getCurrentContext<InteractionCallbacksContext<T>>();

  if (!context.__interactionCallbacks) {
    throw new Error(
      "useInteraction requires __interactionCallbacks in render context. " +
        "Ensure DisactApp.connect is called with proper setup.",
    );
  }

  context.__interactionCallbacks.push(callback as InteractionCallback<unknown>);
};
