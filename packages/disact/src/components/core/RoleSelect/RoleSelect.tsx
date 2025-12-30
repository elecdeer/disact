import { ComponentType } from "discord-api-types/v10";
import type { FC } from "../../..";

export type RoleSelectProps = {
  id?: number;
  customId: string;
  placeholder?: string;
  minValues?: number;
  maxValues?: number;
  disabled?: boolean;
  required?: boolean;
  defaultValues?: {
    id: string;
    type: "role";
  }[];
};

/**
 * RoleSelect - ロール選択メニューコンポーネント
 *
 * @example
 * ```tsx
 * <RoleSelect customId="role-select" placeholder="ロールを選択" />
 * ```
 */
export const RoleSelect: FC<RoleSelectProps> = (props) => {
  return <message-component type={ComponentType.RoleSelect} {...props} />;
};
