import type { APIMessageComponentInteraction } from "discord-api-types/v10";
import { ComponentType, InteractionType } from "discord-api-types/v10";
import type { FC } from "../../..";
import { useInteraction } from "../../../hooks";

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
  onSelect?: (
    interaction: APIMessageComponentInteraction,
    values: string[],
  ) => void | Promise<void>;
};

/**
 * RoleSelect - ロール選択メニューコンポーネント
 *
 * @example
 * ```tsx
 * <RoleSelect
 *   customId="role-select"
 *   placeholder="ロールを選択"
 *   onSelect={(interaction, values) => {
 *     console.log('Selected roles:', values);
 *   }}
 * />
 * ```
 */
export const RoleSelect: FC<RoleSelectProps> = ({ onSelect, customId, ...props }) => {
  // onSelectハンドラーを登録

  useInteraction<APIMessageComponentInteraction>((interaction) => {
    // このセレクトが選択された場合のみ実行
    if (
      interaction.type === InteractionType.MessageComponent &&
      interaction.data.component_type === ComponentType.RoleSelect &&
      interaction.data.custom_id === customId
    ) {
      return onSelect?.(interaction, interaction.data.values);
    }
  });

  return <message-component type={ComponentType.RoleSelect} customId={customId} {...props} />;
};
