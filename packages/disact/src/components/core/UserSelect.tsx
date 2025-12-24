import type { DisactNode } from "@disact/engine";
import { ComponentType } from "discord-api-types/v10";
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
  return <message-component type={ComponentType.UserSelect} {...props} />;
};
