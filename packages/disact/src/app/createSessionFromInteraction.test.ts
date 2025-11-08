import { describe, expect, it, vi } from "vitest";
import type { PayloadElements } from "../components";
import {
  type ApplicationCommandInteraction,
  createSessionFromApplicationCommandInteraction,
} from "./createSessionFromInteraction";

// Discord API関数のモック
vi.mock("../api/discord-api", () => ({
  createInteractionResponse: vi.fn(),
  getOriginalWebhookMessage: vi.fn(),
  updateOriginalWebhookMessage: vi.fn(),
}));

// テスト用のモックinteractionオブジェクト
const createMockInteraction = (): ApplicationCommandInteraction =>
  ({
    id: "interaction-id-123",
    application_id: "app-id-456",
    type: 2,
    token: "interaction-token-xyz",
    guild_id: "guild-id-789",
    channel_id: "channel-id-abc",
  }) as ApplicationCommandInteraction;

describe("createSessionFromApplicationCommandInteraction", () => {
  it("初回のgetCurrentはnullを返す", async () => {
    const interaction = createMockInteraction();
    const session = createSessionFromApplicationCommandInteraction(interaction);

    const current = await session.getCurrent();
    expect(current).toBeNull();
  });

  it("interactionからapplication_idとtokenを抽出して使用する", async () => {
    const { createInteractionResponse, updateOriginalWebhookMessage } =
      await import("../api/discord-api");
    vi.mocked(createInteractionResponse).mockClear();
    vi.mocked(updateOriginalWebhookMessage).mockClear();

    const interaction = createMockInteraction();
    const session = createSessionFromApplicationCommandInteraction(interaction);

    const payload1: PayloadElements = [
      {
        type: 17,
        components: [{ type: 10, content: "First" }],
      },
    ];

    const payload2: PayloadElements = [
      {
        type: 17,
        components: [{ type: 10, content: "Second" }],
      },
    ];

    await session.commit(payload1);
    await session.commit(payload2);

    // 初回はcreateInteractionResponseが呼ばれることを確認
    expect(createInteractionResponse).toHaveBeenCalledTimes(1);
    expect(createInteractionResponse).toHaveBeenCalledWith(
      interaction.id,
      interaction.token,
      expect.objectContaining({
        type: 4,
        data: expect.any(Object),
      }),
    );

    // 2回目はupdateOriginalWebhookMessageが呼ばれることを確認
    expect(updateOriginalWebhookMessage).toHaveBeenCalledTimes(1);
    expect(updateOriginalWebhookMessage).toHaveBeenCalledWith(
      interaction.application_id,
      interaction.token,
      payload2,
    );
  });

  it("初回と2回目以降のcommitで異なるAPIを呼び出す", async () => {
    const { createInteractionResponse, updateOriginalWebhookMessage } =
      await import("../api/discord-api");
    vi.mocked(createInteractionResponse).mockClear();
    vi.mocked(updateOriginalWebhookMessage).mockClear();

    const interaction = createMockInteraction();
    const session = createSessionFromApplicationCommandInteraction(interaction);

    const payload1: PayloadElements = [
      {
        type: 17,
        components: [{ type: 10, content: "First" }],
      },
    ];

    const payload2: PayloadElements = [
      {
        type: 17,
        components: [{ type: 10, content: "Second" }],
      },
    ];

    await session.commit(payload1);
    await session.commit(payload2);

    // 初回はcreateInteractionResponseが呼ばれる
    expect(createInteractionResponse).toHaveBeenCalledTimes(1);
    // 2回目はupdateOriginalWebhookMessageが呼ばれる
    expect(updateOriginalWebhookMessage).toHaveBeenCalledTimes(1);
    // 最後の呼び出しがpayload2で行われたことを確認
    expect(updateOriginalWebhookMessage).toHaveBeenLastCalledWith(
      interaction.application_id,
      interaction.token,
      payload2,
    );
  });

  it("commit後のgetCurrentでメッセージを取得する", async () => {
    const { getOriginalWebhookMessage } = await import("../api/discord-api");

    const mockMessageResponse = {
      id: "message-id",
      channel_id: "channel-id",
      author: { id: "author-id", username: "bot", discriminator: "0000" },
      content: "",
      timestamp: new Date().toISOString(),
      edited_timestamp: null,
      tts: false,
      mention_everyone: false,
      mentions: [],
      mention_roles: [],
      attachments: [],
      embeds: [],
      pinned: false,
      type: 0,
      flags: 0,
      components: [{ type: 10, content: "Hello World" }],
    };

    vi.mocked(getOriginalWebhookMessage).mockResolvedValue(
      mockMessageResponse as any,
    );

    const interaction = createMockInteraction();
    const session = createSessionFromApplicationCommandInteraction(
      interaction,
      {
        alwaysFetch: true,
      },
    );

    const payload: PayloadElements = [
      {
        type: 17,
        components: [{ type: 10, content: "Hello World" }],
      },
    ];

    await session.commit(payload);

    const current = await session.getCurrent();

    expect(getOriginalWebhookMessage).toHaveBeenCalledWith(
      interaction.application_id,
      interaction.token,
    );

    expect(current).toEqual([{ type: 10, content: "Hello World" }]);
  });

  it("デフォルトではgetCurrentはキャッシュを返す（APIを呼ばない）", async () => {
    const { getOriginalWebhookMessage } = await import("../api/discord-api");
    vi.mocked(getOriginalWebhookMessage).mockClear();

    const interaction = createMockInteraction();
    const session = createSessionFromApplicationCommandInteraction(interaction);

    const payload: PayloadElements = [
      {
        type: 17,
        components: [{ type: 10, content: "Cached" }],
      },
    ];

    await session.commit(payload);

    // 1回目のgetCurrent - キャッシュから返す
    const current1 = await session.getCurrent();
    expect(current1).toEqual(payload);
    expect(getOriginalWebhookMessage).not.toHaveBeenCalled();

    // 2回目のgetCurrent - やはりキャッシュから返す
    const current2 = await session.getCurrent();
    expect(current2).toEqual(payload);
    expect(getOriginalWebhookMessage).not.toHaveBeenCalled();
  });

  it("alwaysFetch: trueの場合、getCurrentは毎回APIから取得する", async () => {
    const { getOriginalWebhookMessage } = await import("../api/discord-api");
    vi.mocked(getOriginalWebhookMessage).mockClear();

    const mockMessageResponse = {
      components: [{ type: 10, content: "From API" }],
    };

    vi.mocked(getOriginalWebhookMessage).mockResolvedValue(
      mockMessageResponse as any,
    );

    const interaction = createMockInteraction();
    const session = createSessionFromApplicationCommandInteraction(
      interaction,
      {
        alwaysFetch: true,
      },
    );

    const payload: PayloadElements = [
      {
        type: 17,
        components: [{ type: 10, content: "Committed" }],
      },
    ];

    await session.commit(payload);

    // 1回目のgetCurrent - APIから取得
    const current1 = await session.getCurrent();
    expect(current1).toEqual([{ type: 10, content: "From API" }]);
    expect(getOriginalWebhookMessage).toHaveBeenCalledTimes(1);

    // 2回目のgetCurrent - 再度APIから取得
    const current2 = await session.getCurrent();
    expect(current2).toEqual([{ type: 10, content: "From API" }]);
    expect(getOriginalWebhookMessage).toHaveBeenCalledTimes(2);
  });

  it("ephemeralオプションは実装されていないが指定可能（将来の拡張用）", async () => {
    const interaction = createMockInteraction();
    const session = createSessionFromApplicationCommandInteraction(
      interaction,
      {
        ephemeral: true,
      },
    );

    // ephemeralは現在実装されていないが、オプションとして指定可能
    expect(session).toBeDefined();
  });
});
