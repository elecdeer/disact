import type { DisactNode } from "@disact/engine";
import type { MentionableSelectElement } from "../elements/mentionableSelectElement";

export type MentionableSelectProps = MentionableSelectElement;

/**
 * MentionableSelect - メンション可能対象選択メニューコンポーネント
 *
 * @example
 * ```tsx
 * <MentionableSelect customId="mentionable-select" placeholder="選択してください" />
 * ```
 */
export const MentionableSelect = (props: MentionableSelectProps): DisactNode => {
  return <mentionableSelect {...props} />;
};
