import type { APIMessageComponentInteraction } from "discord-api-types/v10";
import { ComponentType, InteractionType } from "discord-api-types/v10";
import type { FC } from "../../..";
import { useInteraction } from "../../../hooks";

export type StringSelectProps = {
  id?: number;
  customId: string;
  placeholder?: string;
  minValues?: number;
  maxValues?: number;
  disabled?: boolean;
  required?: boolean;
  options: Array<{
    label: string;
    value: string;
    description?: string;
    default?: boolean;
    emoji?: {
      id?: string;
      name: string;
    };
  }>;
  onSelect?: (
    interaction: APIMessageComponentInteraction,
    values: string[],
  ) => void | Promise<void>;
};

/**
 * StringSelect - 文字列選択メニューコンポーネント
 *
 * @example
 * ```tsx
 * <StringSelect
 *   customId="select"
 *   placeholder="選択してください"
 *   options={[
 *     { label: "オプション1", value: "1" },
 *     { label: "オプション2", value: "2" },
 *   ]}
 *   onSelect={(interaction, values) => {
 *     console.log('Selected:', values);
 *   }}
 * />
 * ```
 */
export const StringSelect: FC<StringSelectProps> = ({ onSelect, customId, ...props }) => {
  // onSelectハンドラーを登録
  useInteraction<APIMessageComponentInteraction>((interaction) => {
    // このセレクトが選択された場合のみ実行
    if (
      interaction.type === InteractionType.MessageComponent &&
      interaction.data.component_type === ComponentType.StringSelect &&
      interaction.data.custom_id === customId
    ) {
      return onSelect?.(interaction, interaction.data.values);
    }
  });

  return <message-component type={ComponentType.StringSelect} customId={customId} {...props} />;
};
