import type { APIMessageComponentInteraction } from "discord-api-types/v10";
import { ComponentType, InteractionType } from "discord-api-types/v10";
import type { FC } from "../../..";
import { useInteraction } from "../../../hooks";

export type MentionableSelectProps = {
  id?: number;
  customId: string;
  placeholder?: string;
  minValues?: number;
  maxValues?: number;
  disabled?: boolean;
  required?: boolean;
  defaultValues?: {
    id: string;
    type: "user" | "role";
  }[];
  onSelect?: (
    interaction: APIMessageComponentInteraction,
    values: string[],
  ) => void | Promise<void>;
};

/**
 * MentionableSelect - メンション可能対象選択メニューコンポーネント
 *
 * @example
 * ```tsx
 * <MentionableSelect
 *   customId="mentionable-select"
 *   placeholder="選択してください"
 *   onSelect={(interaction, values) => {
 *     console.log('Selected mentionables:', values);
 *   }}
 * />
 * ```
 */
export const MentionableSelect: FC<MentionableSelectProps> = ({ onSelect, customId, ...props }) => {
  // onSelectハンドラーを登録

  useInteraction<APIMessageComponentInteraction>((interaction) => {
    // このセレクトが選択された場合のみ実行
    if (
      interaction.type === InteractionType.MessageComponent &&
      interaction.data.component_type === ComponentType.MentionableSelect &&
      interaction.data.custom_id === customId
    ) {
      return onSelect?.(interaction, interaction.data.values);
    }
  });

  return (
    <message-component type={ComponentType.MentionableSelect} customId={customId} {...props} />
  );
};
