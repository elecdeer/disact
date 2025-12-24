import type { DisactNode } from "@disact/engine";
import { ComponentType } from "discord-api-types/v10";
import type { StringSelectElement } from "../elements/stringSelectElement";

export type StringSelectProps = StringSelectElement;

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
export const StringSelect = (props: StringSelectProps): DisactNode => {
  return <message-component type={ComponentType.StringSelect} {...props} />;
};
