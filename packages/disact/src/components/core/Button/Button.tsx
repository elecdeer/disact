import { ComponentType } from "discord-api-types/v10";
import type { DisactNode, FC } from "../../..";

export type ButtonProps = {
  id?: number;
  children?: DisactNode;
  disabled?: boolean;
} & (
  | { style: "primary" | "secondary" | "success" | "danger"; customId: string }
  | { style: "link"; url: string }
  | { style: "premium"; skuId: string }
);

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
export const Button: FC<ButtonProps> = ({ children, ...rest }) => {
  return (
    <message-component type={ComponentType.Button} {...rest}>
      {children ? <slot name="children">{children}</slot> : null}
    </message-component>
  );
};
