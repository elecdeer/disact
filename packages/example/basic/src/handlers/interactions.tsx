import {
  ActionRow,
  Button,
  Components,
  Section,
  Separator,
  StringSelect,
  TextDisplay,
  createDisactApp,
  createSessionFromApplicationCommandInteraction,
} from "disact";
import type {
  APIApplicationCommandInteraction,
  APIInteraction,
  APIInteractionResponse,
} from "discord-api-types/v10";
import {
  InteractionType as DiscordInteractionType,
  InteractionResponseType,
} from "discord-api-types/v10";
import type { Context } from "hono";

/**
 * Discord Interactionを処理するハンドラー
 *
 * @param c - Honoのコンテキスト
 * @returns Interactionに対するレスポンス
 */
export const handleInteraction = async (c: Context): Promise<APIInteractionResponse> => {
  // ミドルウェアで保存された生のボディを取得
  const rawBody = c.get("rawBody") as string;
  const interaction: APIInteraction = JSON.parse(rawBody);

  console.log("Interaction受信:", {
    type: interaction.type,
    id: interaction.id,
  });

  // PING (Type 1) への応答
  if (interaction.type === DiscordInteractionType.Ping) {
    return {
      type: InteractionResponseType.Pong,
    };
  }

  // APPLICATION_COMMAND (Type 2) への応答
  if (interaction.type === DiscordInteractionType.ApplicationCommand) {
    // 非同期でメッセージを送信
    void handleApplicationCommand(interaction);

    // まずDeferredレスポンスを即座に返す（3秒制限を守るため）
    return {
      type: InteractionResponseType.DeferredChannelMessageWithSource,
    };
  }

  // その他のInteractionタイプ（今後実装予定）
  console.warn("未対応のInteractionタイプ:", interaction.type);
  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content: "このInteractionタイプはまだ実装されていません。",
    },
  };
};

/**
 * APPLICATION_COMMAND Interactionを処理
 *
 * disactAppとSessionを使用してMessage Componentsを生成・送信します。
 *
 * @param interaction - Interactionデータ
 */
const handleApplicationCommand = async (
  interaction: APIApplicationCommandInteraction,
): Promise<void> => {
  try {
    // Sessionを作成
    const session = createSessionFromApplicationCommandInteraction(interaction, {
      ephemeral: false,
    });

    // DisactAppを作成
    const app = createDisactApp();

    // disactを使用してMessage Componentsを定義
    const element = (
      <Components>
        <Section
          accessory={
            <Button customId="section_button" style="primary">
              アクション
            </Button>
          }
        >
          <TextDisplay>✨ Hello from disact!</TextDisplay>
          <TextDisplay>実行されたコマンド: /{interaction.data.name}</TextDisplay>
          <TextDisplay>
            disactを使用してDiscord Message ComponentsをJSXで記述しています！
          </TextDisplay>
        </Section>

        <Separator />

        <ActionRow>
          <Button customId="button_primary" style="primary">
            Primary Button
          </Button>
          <Button customId="button_success" style="success">
            Success Button
          </Button>
          <Button customId="button_danger" style="danger">
            Danger Button
          </Button>
        </ActionRow>

        <ActionRow>
          <StringSelect
            customId="string_select"
            placeholder="オプションを選択..."
            options={[
              { label: "オプション 1", value: "option_1" },
              { label: "オプション 2", value: "option_2" },
              { label: "オプション 3", value: "option_3" },
            ]}
          />
        </ActionRow>
      </Components>
    );

    // JSXをレンダリングしてSessionに接続
    // これにより自動的にDiscord APIにメッセージが送信される
    await app.connect(session, element);

    console.log("メッセージの送信が完了しました");
  } catch (error) {
    console.error("APPLICATION_COMMAND処理中にエラーが発生:", error);
  }
};
