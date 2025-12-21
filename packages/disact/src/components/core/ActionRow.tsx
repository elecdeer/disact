import type { DisactNode } from "@disact/engine";
import type { ActionRowElement } from "../elements/actionRowElement";

export type ActionRowProps = ActionRowElement;

/**
 * ActionRow - アクション行コンポーネント
 *
 * @example
 * ```tsx
 * <ActionRow>
 *   <Button customId="btn1" style="primary">Button 1</Button>
 *   <Button customId="btn2" style="secondary">Button 2</Button>
 * </ActionRow>
 * ```
 */
export const ActionRow = (props: ActionRowProps): DisactNode => {
  return <actionRow {...props} />;
};
