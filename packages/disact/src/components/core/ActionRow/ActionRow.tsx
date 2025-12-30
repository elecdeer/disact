import type { DisactNode } from "@disact/engine";
import { ComponentType } from "discord-api-types/v10";
import type { FC } from "../../..";

export type ActionRowProps = {
  id?: number;
  children: DisactNode;
};

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
export const ActionRow: FC<ActionRowProps> = ({
  children,
  ...rest
}: ActionRowProps): DisactNode => {
  return (
    <message-component type={ComponentType.ActionRow} {...rest}>
      <slot name="components">{children}</slot>
    </message-component>
  );
};
