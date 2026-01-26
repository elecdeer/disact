import { getCurrentContext } from "@disact/engine";

export type RerenderContext = {
  __requestRerender?: () => void;
  [key: string]: unknown;
};

/**
 * 再レンダリングをトリガーする関数を取得するフック
 *
 * @returns 再レンダリングをトリガーする関数
 * @throws コンテキストに__requestRerenderが存在しない場合
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
  const context = getCurrentContext<RerenderContext>();

  if (!context.__requestRerender) {
    throw new Error(
      "useRerender requires __requestRerender in render context.",
    );
  }

  return context.__requestRerender;
};
