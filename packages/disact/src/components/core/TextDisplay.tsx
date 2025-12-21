import type { DisactNode } from "@disact/engine";
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
export const TextDisplay = (props: TextDisplayProps): DisactNode => {
  return <textDisplay {...props} />;
};
