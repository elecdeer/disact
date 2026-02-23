import { getCurrentContext } from "@disact/engine";
import type { APIInteraction } from "discord-api-types/v10";

/**
 * Interactionコールバックの型
 */
export type InteractionCallback<T = APIInteraction> = (interaction: T) => void | Promise<void>;

/**
 * Interactionコールバックを保持するContext型
 */
export type InteractionCallbacksContext<T = APIInteraction> = {
  __interaction?: T;
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
export const useInteraction = <T = APIInteraction>(callback: InteractionCallback<T>): void => {
  const context = getCurrentContext<InteractionCallbacksContext<T>>();

  if (!context.__interactionCallbacks) {
    throw new Error(
      "useInteraction requires __interactionCallbacks in render context. " +
        "Ensure DisactApp.connect is called with proper setup.",
    );
  }

  context.__interactionCallbacks.push(callback as InteractionCallback<unknown>);
};

/**
 * 現在のInteractionオブジェクトを取得する
 *
 * @returns 現在のInteractionオブジェクト、または存在しない場合はundefined
 * @throws レンダリングコンテキスト外で呼び出された場合
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const interaction = useCurrentInteraction<APIMessageComponentInteraction>();
 *   if (interaction) {
 *     console.log('Current interaction:', interaction.id);
 *   }
 *   return <Text>Hello</Text>;
 * };
 * ```
 */
export const useCurrentInteraction = <T = APIInteraction>(): T | undefined => {
  const context = getCurrentContext<InteractionCallbacksContext<T>>();
  return context.__interaction as T | undefined;
};
