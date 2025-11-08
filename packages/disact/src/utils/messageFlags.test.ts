import { MessageFlags } from "discord-api-types/v10";
import { describe, expect, test } from "vitest";
import { messageFlags } from "./messageFlags";

describe("buildMessageFlags", () => {
  test("空のオブジェクトは0を返す", () => {
    expect(messageFlags({})).toBe(0);
  });

  test("単一フラグ: ephemeral", () => {
    expect(messageFlags({ ephemeral: true })).toBe(MessageFlags.Ephemeral);
  });

  test("単一フラグ: suppressNotifications", () => {
    expect(messageFlags({ suppressNotifications: true })).toBe(
      MessageFlags.SuppressNotifications,
    );
  });

  test("単一フラグ: isComponentsV2", () => {
    expect(messageFlags({ isComponentsV2: true })).toBe(
      MessageFlags.IsComponentsV2,
    );
  });

  test("複数フラグの組み合わせ: ephemeral と suppressNotifications", () => {
    const flags = messageFlags({
      ephemeral: true,
      suppressNotifications: true,
    });
    expect(flags).toBe(
      MessageFlags.Ephemeral | MessageFlags.SuppressNotifications,
    );
    // 64 | 4096 = 4160
    expect(flags).toBe(4160);
  });

  test("複数フラグの組み合わせ: ephemeral と isComponentsV2", () => {
    const flags = messageFlags({
      ephemeral: true,
      isComponentsV2: true,
    });
    expect(flags).toBe(MessageFlags.Ephemeral | MessageFlags.IsComponentsV2);
    // 64 | 32768 = 32832
    expect(flags).toBe(32832);
  });

  test("既存の使用例を再現: isComponentsV2のみ", () => {
    // (1 << 15) = 32768 = IsComponentsV2
    const flags = messageFlags({
      isComponentsV2: true,
    });
    expect(flags).toBe(1 << 15);
    expect(flags).toBe(32768);
  });

  test("既存の使用例を再現: isComponentsV2 + ephemeral", () => {
    // (1 << 15) | (1 << 6) = 32768 | 64 = 32832
    const flags = messageFlags({
      isComponentsV2: true,
      ephemeral: true,
    });
    expect(flags).toBe((1 << 15) | (1 << 6));
    expect(flags).toBe(32832);
  });

  test("falseなフラグは無視される", () => {
    const flags = messageFlags({
      ephemeral: true,
      suppressNotifications: false,
    });
    expect(flags).toBe(MessageFlags.Ephemeral);
  });

  test("すべてのフラグが正しくマッピングされている", () => {
    // 各フラグを個別にテスト
    expect(messageFlags({ crossposted: true })).toBe(MessageFlags.Crossposted);
    expect(messageFlags({ isCrosspost: true })).toBe(MessageFlags.IsCrosspost);
    expect(messageFlags({ suppressEmbeds: true })).toBe(
      MessageFlags.SuppressEmbeds,
    );
    expect(messageFlags({ sourceMessageDeleted: true })).toBe(
      MessageFlags.SourceMessageDeleted,
    );
    expect(messageFlags({ urgent: true })).toBe(MessageFlags.Urgent);
    expect(messageFlags({ hasThread: true })).toBe(MessageFlags.HasThread);
    expect(messageFlags({ ephemeral: true })).toBe(MessageFlags.Ephemeral);
    expect(messageFlags({ loading: true })).toBe(MessageFlags.Loading);
    expect(messageFlags({ failedToMentionSomeRolesInThread: true })).toBe(
      MessageFlags.FailedToMentionSomeRolesInThread,
    );
    expect(messageFlags({ shouldShowLinkNotDiscordWarning: true })).toBe(
      MessageFlags.ShouldShowLinkNotDiscordWarning,
    );
    expect(messageFlags({ suppressNotifications: true })).toBe(
      MessageFlags.SuppressNotifications,
    );
    expect(messageFlags({ isVoiceMessage: true })).toBe(
      MessageFlags.IsVoiceMessage,
    );
    expect(messageFlags({ hasSnapshot: true })).toBe(MessageFlags.HasSnapshot);
    expect(messageFlags({ isComponentsV2: true })).toBe(
      MessageFlags.IsComponentsV2,
    );
  });

  test("すべてのフラグを有効にする", () => {
    const allFlags = messageFlags({
      crossposted: true,
      isCrosspost: true,
      suppressEmbeds: true,
      sourceMessageDeleted: true,
      urgent: true,
      hasThread: true,
      ephemeral: true,
      loading: true,
      failedToMentionSomeRolesInThread: true,
      shouldShowLinkNotDiscordWarning: true,
      suppressNotifications: true,
      isVoiceMessage: true,
      hasSnapshot: true,
      isComponentsV2: true,
    });

    const expectedFlags =
      MessageFlags.Crossposted |
      MessageFlags.IsCrosspost |
      MessageFlags.SuppressEmbeds |
      MessageFlags.SourceMessageDeleted |
      MessageFlags.Urgent |
      MessageFlags.HasThread |
      MessageFlags.Ephemeral |
      MessageFlags.Loading |
      MessageFlags.FailedToMentionSomeRolesInThread |
      MessageFlags.ShouldShowLinkNotDiscordWarning |
      MessageFlags.SuppressNotifications |
      MessageFlags.IsVoiceMessage |
      MessageFlags.HasSnapshot |
      MessageFlags.IsComponentsV2;

    expect(allFlags).toBe(expectedFlags);
    // 1 | 2 | 4 | 8 | 16 | 32 | 64 | 128 | 256 | 1024 | 4096 | 8192 | 16384 | 32768 = 62975
    expect(allFlags).toBe(62975);
  });
});
