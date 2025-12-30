import { ComponentType } from "discord-api-types/v10";
import type { FC } from "../../..";

export type SeparatorProps = {
  id?: number;
  spacing?: number | null;
  divider?: boolean;
};

/**
 * Separator - 区切り線コンポーネント
 *
 * @example
 * ```tsx
 * <Separator />
 * ```
 */
export const Separator: FC<SeparatorProps> = (props = {}) => {
  return <message-component type={ComponentType.Separator} {...props} />;
};
