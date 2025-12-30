import { ComponentType } from "discord-api-types/v10";
import type { FC } from "../../..";

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
};

/**
 * MentionableSelect - メンション可能対象選択メニューコンポーネント
 *
 * @example
 * ```tsx
 * <MentionableSelect customId="mentionable-select" placeholder="選択してください" />
 * ```
 */
export const MentionableSelect: FC<MentionableSelectProps> = (props) => {
  return <message-component type={ComponentType.MentionableSelect} {...props} />;
};
