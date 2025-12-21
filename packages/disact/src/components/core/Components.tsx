import type { DisactNode } from "@disact/engine";
import type { MessageComponentsRootElement } from "../elements/messageComponentRoot";

export type ComponentsProps = MessageComponentsRootElement;

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
export const Components = (props: ComponentsProps): DisactNode => {
  return <components {...props} />;
};
