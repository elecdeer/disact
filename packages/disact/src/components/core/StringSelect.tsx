import { ComponentType } from "discord-api-types/v10";
import type { FC } from "../..";

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
 * />
 * ```
 */
export const StringSelect: FC<StringSelectProps> = (props) => {
  return <message-component type={ComponentType.StringSelect} {...props} />;
};
