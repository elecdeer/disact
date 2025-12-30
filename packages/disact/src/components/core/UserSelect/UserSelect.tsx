import { ComponentType } from "discord-api-types/v10";
import type { FC } from "../../..";

export type UserSelectProps = {
  id?: number;
  customId: string;
  placeholder?: string;
  minValues?: number;
  maxValues?: number;
  disabled?: boolean;
  required?: boolean;
  defaultValues?: {
    id: string;
    type: "user";
  }[];
};

/**
 * UserSelect - ユーザー選択メニューコンポーネント
 *
 * @example
 * ```tsx
 * <UserSelect customId="user-select" placeholder="ユーザーを選択" />
 * ```
 */
export const UserSelect: FC<UserSelectProps> = (props) => {
  return <message-component type={ComponentType.UserSelect} {...props} />;
};
