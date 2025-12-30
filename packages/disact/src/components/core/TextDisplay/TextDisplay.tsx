import { ComponentType } from "discord-api-types/v10";
import type { DisactNode, FC } from "../../..";

export type TextDisplayProps = {
  id?: number;
  children: DisactNode;
};

/**
 * TextDisplay - テキスト表示コンポーネント
 *
 * @example
 * ```tsx
 * <TextDisplay>Hello, World!</TextDisplay>
 * ```
 */
export const TextDisplay: FC<TextDisplayProps> = ({ children, ...rest }) => {
  return (
    <message-component type={ComponentType.TextDisplay} {...rest}>
      <slot name="children">{children}</slot>
    </message-component>
  );
};
