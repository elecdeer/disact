import type { DisactNode } from "@disact/engine";
import { ComponentType } from "discord-api-types/v10";
import type { ChannelSelectElement } from "../elements/channelSelectElement";

export type ChannelSelectProps = ChannelSelectElement;

/**
 * ChannelSelect - チャンネル選択メニューコンポーネント
 *
 * @example
 * ```tsx
 * <ChannelSelect customId="channel-select" placeholder="チャンネルを選択" />
 * ```
 */
export const ChannelSelect = (props: ChannelSelectProps): DisactNode => {
  return <message-component type={ComponentType.ChannelSelect} {...props} />;
};
