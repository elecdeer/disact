import { MessageFlags } from "discord-api-types/v10";

/**
 * Message flags のビルド用入力型
 *
 * Discord API の MessageFlags を boolean プロパティで指定できる形式に変換
 */
export type MessageFlagsInput = {
  /** このメッセージはチャンネルフォロー経由で購読チャンネルに公開されている */
  crossposted?: boolean;
  /** このメッセージはチャンネルフォロー経由で別のチャンネルから発信されている */
  isCrosspost?: boolean;
  /** このメッセージをシリアライズする際に埋め込みを含めない */
  suppressEmbeds?: boolean;
  /** このクロスポストの元メッセージが削除されている */
  sourceMessageDeleted?: boolean;
  /** このメッセージは緊急メッセージシステムから送信されている */
  urgent?: boolean;
  /** このメッセージには関連するスレッドがあり、そのIDを共有している */
  hasThread?: boolean;
  /** このメッセージはインタラクションを呼び出したユーザーにのみ表示される */
  ephemeral?: boolean;
  /** このメッセージはインタラクションレスポンスであり、ボットが「考え中」である */
  loading?: boolean;
  /** このメッセージは一部のロールのメンションに失敗し、そのメンバーをスレッドに追加できなかった */
  failedToMentionSomeRolesInThread?: boolean;
  /** このメッセージはリンクがDiscordでないことの警告を表示する必要がある（不安定） */
  shouldShowLinkNotDiscordWarning?: boolean;
  /** このメッセージはプッシュ通知とデスクトップ通知をトリガーしない */
  suppressNotifications?: boolean;
  /** このメッセージはボイスメッセージである */
  isVoiceMessage?: boolean;
  /** このメッセージにはスナップショットがある（メッセージ転送経由） */
  hasSnapshot?: boolean;
  /** 完全にコンポーネント駆動のメッセージを作成できる */
  isComponentsV2?: boolean;
};

/**
 * オブジェクト形式の message flags から Discord API の flags 数値を生成する
 *
 * @param flags - boolean プロパティで指定するフラグ
 * @returns Discord API に送信する flags 数値
 *
 * @example
 * ```typescript
 * const flags = buildMessageFlags({
 *   ephemeral: true,
 *   suppressNotifications: true,
 * });
 * // flags = 4160 (64 | 4096)
 * ```
 */
export const messageFlags = (flags: MessageFlagsInput): number => {
  let result = 0;

  if (flags.crossposted) result |= MessageFlags.Crossposted;
  if (flags.isCrosspost) result |= MessageFlags.IsCrosspost;
  if (flags.suppressEmbeds) result |= MessageFlags.SuppressEmbeds;
  if (flags.sourceMessageDeleted) result |= MessageFlags.SourceMessageDeleted;
  if (flags.urgent) result |= MessageFlags.Urgent;
  if (flags.hasThread) result |= MessageFlags.HasThread;
  if (flags.ephemeral) result |= MessageFlags.Ephemeral;
  if (flags.loading) result |= MessageFlags.Loading;
  if (flags.failedToMentionSomeRolesInThread)
    result |= MessageFlags.FailedToMentionSomeRolesInThread;
  if (flags.shouldShowLinkNotDiscordWarning) result |= MessageFlags.ShouldShowLinkNotDiscordWarning;
  if (flags.suppressNotifications) result |= MessageFlags.SuppressNotifications;
  if (flags.isVoiceMessage) result |= MessageFlags.IsVoiceMessage;
  if (flags.hasSnapshot) result |= MessageFlags.HasSnapshot;
  if (flags.isComponentsV2) result |= MessageFlags.IsComponentsV2;

  return result;
};
