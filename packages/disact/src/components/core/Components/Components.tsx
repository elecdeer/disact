import type { DisactNode, FC } from "../../..";

export type ComponentsProps = {
  children: DisactNode;
};

/**
 * Components - メッセージコンポーネントのルート要素
 *
 * @example
 * ```tsx
 * <Components>
 *   <Section>...</Section>
 *   <ActionRow>...</ActionRow>
 * </Components>
 * ```
 */
export const Components: FC<ComponentsProps> = ({ children }) => {
  return <>{children}</>;
};
