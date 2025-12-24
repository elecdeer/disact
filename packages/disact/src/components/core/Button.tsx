import type { DisactNode } from "@disact/engine";
import { ComponentType } from "discord-api-types/v10";
import type { ButtonElement } from "../elements/buttonElement";

export type ButtonProps = ButtonElement;

/**
 * Button - クリック可能なボタンコンポーネント
 *
 * @example
 * ```tsx
 * <Button customId="my-button" style="primary">
 *   Click me
 * </Button>
 * ```
 */
export const Button = ({ children, ...rest }: ButtonProps): DisactNode => {
  return (
    <message-component type={ComponentType.Button} {...rest}>
      {children ? <slot name="children">{children}</slot> : null}
    </message-component>
  );
};
