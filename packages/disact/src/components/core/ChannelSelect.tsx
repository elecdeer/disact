import { ComponentType } from "discord-api-types/v10";
import type { FC } from "../..";

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
};

/**
 * ChannelSelect - チャンネル選択メニューコンポーネント
 *
 * @example
 * ```tsx
 * <ChannelSelect customId="channel-select" placeholder="チャンネルを選択" />
 * ```
 */
export const ChannelSelect: FC<ChannelSelectProps> = (props) => {
  return <message-component type={ComponentType.ChannelSelect} {...props} />;
};
