import type { DisactNode } from "@disact/engine";
import { ComponentType } from "discord-api-types/v10";
import type { SeparatorElement } from "../elements/separatorElement";

export type SeparatorProps = SeparatorElement;

/**
 * Separator - 区切り線コンポーネント
 *
 * @example
 * ```tsx
 * <Separator />
 * ```
 */
export const Separator = (props: SeparatorProps = {}): DisactNode => {
  return <message-component type={ComponentType.Separator} {...props} />;
};
