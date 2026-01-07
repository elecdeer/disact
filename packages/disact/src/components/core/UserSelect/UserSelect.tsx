import type { APIMessageComponentInteraction } from "discord-api-types/v10";
import { ComponentType, InteractionType } from "discord-api-types/v10";
import type { FC } from "../../..";
import { useInteraction } from "../../../hooks";

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
  onSelect?: (
    interaction: APIMessageComponentInteraction,
    values: string[],
  ) => void | Promise<void>;
};

/**
 * UserSelect - ユーザー選択メニューコンポーネント
 *
 * @example
 * ```tsx
 * <UserSelect
 *   customId="user-select"
 *   placeholder="ユーザーを選択"
 *   onSelect={(interaction, values) => {
 *     console.log('Selected users:', values);
 *   }}
 * />
 * ```
 */
export const UserSelect: FC<UserSelectProps> = ({ onSelect, customId, ...props }) => {
  // onSelectハンドラーを登録

  useInteraction<APIMessageComponentInteraction>((interaction) => {
    // このセレクトが選択された場合のみ実行
    if (
      interaction.type === InteractionType.MessageComponent &&
      interaction.data.component_type === ComponentType.UserSelect &&
      interaction.data.custom_id === customId
    ) {
      return onSelect?.(interaction, interaction.data.values);
    }
  });

  return <message-component type={ComponentType.UserSelect} customId={customId} {...props} />;
};
