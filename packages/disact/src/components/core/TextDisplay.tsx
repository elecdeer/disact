import type { DisactNode } from "@disact/engine";
import { ComponentType } from "discord-api-types/v10";
import type { TextDisplayElement } from "../elements/textDisplayElement";

export type TextDisplayProps = TextDisplayElement;

/**
 * TextDisplay - テキスト表示コンポーネント
 *
 * @example
 * ```tsx
 * <TextDisplay>Hello, World!</TextDisplay>
 * ```
 */
export const TextDisplay = ({ children, ...rest }: TextDisplayProps): DisactNode => {
  return (
    <message-component type={ComponentType.TextDisplay} {...rest}>
      <slot name="children">{children}</slot>
    </message-component>
  );
};
