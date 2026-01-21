import type { RerenderSignal } from "@disact/engine";
import { getCurrentContext } from "@disact/engine";

export type RerenderSignalContext = {
  __rerenderSignal?: RerenderSignal;
  [key: string]: unknown;
};

/**
 * 再レンダリングをトリガーする関数を取得するフック
 *
 * @returns 再レンダリングをトリガーする関数
 * @throws コンテキストに__rerenderSignalが存在しない場合
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const rerender = useRerender();
 *
 *   // 何らかの条件で再レンダリングをトリガー
 *   if (someCondition) {
 *     rerender();
 *   }
 *
 *   return <Text>Content</Text>;
 * };
 * ```
 */
export const useRerender = (): (() => void) => {
  const context = getCurrentContext<RerenderSignalContext>();

  if (!context.__rerenderSignal) {
    throw new Error(
      "useRerender requires __rerenderSignal in render context.",
    );
  }

  return context.__rerenderSignal.requestRerender;
};
