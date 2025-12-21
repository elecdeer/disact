import type { DisactNode } from "@disact/engine";
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
export const Button = (props: ButtonProps): DisactNode => {
  return <button {...props} />;
};
