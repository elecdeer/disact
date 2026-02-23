import {
  ComponentType,
  InteractionType,
  type APIMessageComponentButtonInteraction,
  type APIMessageComponentSelectMenuInteraction,
} from "discord-api-types/v10";

let snowflakeCounter = 0;

/**
 * テスト用のユニークな Snowflake ID を生成する
 */
const generateTestSnowflake = (): string => {
  snowflakeCounter++;
  return `test-snowflake-${snowflakeCounter}`;
};

/**
 * Snowflake カウンターをリセットする
 *
 * テスト間で独立した ID を生成したい場合に使用する。
 */
export const resetSnowflakeCounter = (): void => {
  snowflakeCounter = 0;
};

/**
 * テスト用ボタンクリックインタラクションを生成する
 *
 * @param customId - クリックするボタンの customId
 * @param overrides - 上書きするフィールド
 * @returns ボタンクリックの APIMessageComponentButtonInteraction
 *
 * @example
 * ```ts
 * const interaction = createButtonInteraction("my-button");
 * await app.connect(session, <Component />);
 * // session.getInteraction() でこのインタラクションが返される
 * ```
 */
export const createButtonInteraction = (
  customId: string,
  overrides?: Partial<APIMessageComponentButtonInteraction>,
): APIMessageComponentButtonInteraction => {
  return {
    id: generateTestSnowflake(),
    application_id: "test-application-id",
    type: InteractionType.MessageComponent,
    token: "test-interaction-token",
    version: 1,
    channel: { id: "test-channel-id", type: 0 },
    channel_id: "test-channel-id",
    entitlements: [],
    authorizing_integration_owners: {},
    app_permissions: "0",
    locale: "en-US",
    data: {
      component_type: ComponentType.Button,
      custom_id: customId,
    },
    message: {
      id: "test-message-id",
      channel_id: "test-channel-id",
      author: {
        id: "test-bot-id",
        username: "test-bot",
        discriminator: "0000",
        avatar: null,
        global_name: null,
      },
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
    },
    ...overrides,
  } as APIMessageComponentButtonInteraction;
};

/**
 * テスト用文字列セレクトメニュー選択インタラクションを生成する
 *
 * @param customId - セレクトメニューの customId
 * @param values - 選択された値の配列
 * @param overrides - 上書きするフィールド
 * @returns セレクトメニュー選択の APIMessageComponentSelectMenuInteraction
 *
 * @example
 * ```ts
 * const interaction = createSelectInteraction("my-select", ["option-1", "option-2"]);
 * ```
 */
export const createSelectInteraction = (
  customId: string,
  values: string[],
  overrides?: Partial<APIMessageComponentSelectMenuInteraction>,
): APIMessageComponentSelectMenuInteraction => {
  return {
    id: generateTestSnowflake(),
    application_id: "test-application-id",
    type: InteractionType.MessageComponent,
    token: "test-interaction-token",
    version: 1,
    channel: { id: "test-channel-id", type: 0 },
    channel_id: "test-channel-id",
    entitlements: [],
    authorizing_integration_owners: {},
    app_permissions: "0",
    locale: "en-US",
    data: {
      component_type: ComponentType.StringSelect,
      custom_id: customId,
      values,
    },
    message: {
      id: "test-message-id",
      channel_id: "test-channel-id",
      author: {
        id: "test-bot-id",
        username: "test-bot",
        discriminator: "0000",
        avatar: null,
        global_name: null,
      },
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
    },
    ...overrides,
  } as APIMessageComponentSelectMenuInteraction;
};
