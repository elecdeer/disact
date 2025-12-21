import type { DisactNode } from "@disact/engine";
import type { UserSelectElement } from "../elements/userSelectElement";

export type UserSelectProps = UserSelectElement;

/**
 * UserSelect - ユーザー選択メニューコンポーネント
 *
 * @example
 * ```tsx
 * <UserSelect customId="user-select" placeholder="ユーザーを選択" />
 * ```
 */
export const UserSelect = (props: UserSelectProps): DisactNode => {
  return <userSelect {...props} />;
};
