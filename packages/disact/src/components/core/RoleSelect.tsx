import type { DisactNode } from "@disact/engine";
import type { RoleSelectElement } from "../elements/roleSelectElement";

export type RoleSelectProps = RoleSelectElement;

/**
 * RoleSelect - ロール選択メニューコンポーネント
 *
 * @example
 * ```tsx
 * <RoleSelect customId="role-select" placeholder="ロールを選択" />
 * ```
 */
export const RoleSelect = (props: RoleSelectProps): DisactNode => {
  return <roleSelect {...props} />;
};
