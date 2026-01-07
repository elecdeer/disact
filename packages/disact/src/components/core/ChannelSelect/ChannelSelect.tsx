import type { APIMessageComponentInteraction } from "discord-api-types/v10";
import { ComponentType, InteractionType } from "discord-api-types/v10";
import type { FC } from "../../..";
import { useInteraction } from "../../../hooks";

export type ChannelSelectProps = {
  id?: number;
  customId: string;
  placeholder?: string;
  minValues?: number;
  maxValues?: number;
  disabled?: boolean;
  required?: boolean;
  defaultValues?: {
    id: string;
    type: "channel";
  }[];
  channelTypes?: number[];
  onSelect?: (
    interaction: APIMessageComponentInteraction,
    values: string[],
  ) => void | Promise<void>;
};

/**
 * ChannelSelect - チャンネル選択メニューコンポーネント
 *
 * @example
 * ```tsx
 * <ChannelSelect
 *   customId="channel-select"
 *   placeholder="チャンネルを選択"
 *   onSelect={(interaction, values) => {
 *     console.log('Selected channels:', values);
 *   }}
 * />
 * ```
 */
export const ChannelSelect: FC<ChannelSelectProps> = ({ onSelect, customId, ...props }) => {
  // onSelectハンドラーを登録
  useInteraction<APIMessageComponentInteraction>((interaction) => {
    // このセレクトが選択された場合のみ実行
    if (
      interaction.type === InteractionType.MessageComponent &&
      interaction.data.component_type === ComponentType.ChannelSelect &&
      interaction.data.custom_id === customId
    ) {
      return onSelect?.(interaction, interaction.data.values);
    }
  });

  return <message-component type={ComponentType.ChannelSelect} customId={customId} {...props} />;
};
