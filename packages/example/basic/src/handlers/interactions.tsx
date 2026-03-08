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
  createSessionFromMessageComponentInteraction,
  useEmbedState,
  useInteraction,
} from "disact";
import type {
  APIApplicationCommandInteraction,
  APIMessageComponentInteraction,
  APIInteraction,
  APIInteractionResponse,
} from "discord-api-types/v10";
import {
  InteractionType as DiscordInteractionType,
  InteractionResponseType,
} from "discord-api-types/v10";
import { context as otelContext } from "@opentelemetry/api";
import type { Context } from "hono";
import { getLogger } from "@logtape/logtape";

const logger = getLogger(["example", "handlers"]);

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

  logger.info("Received interaction", {
    type: interaction.type,
    id: interaction.id,
  });

  // PING (Type 1) への応答
  if (interaction.type === DiscordInteractionType.Ping) {
    logger.debug("Responding to PING");
    return {
      type: InteractionResponseType.Pong,
    };
  }

  // APPLICATION_COMMAND (Type 2) への応答
  if (interaction.type === DiscordInteractionType.ApplicationCommand) {
    // OTelコンテキストをキャプチャして非同期処理に伝播
    const capturedCtx = otelContext.active();
    // 非同期でメッセージを送信
    void otelContext.with(capturedCtx, () => handleApplicationCommand(interaction));

    logger.debug("Returning deferred response");
    // まずDeferredレスポンスを即座に返す（3秒制限を守るため）
    return {
      type: InteractionResponseType.DeferredChannelMessageWithSource,
    };
  }

  // MESSAGE_COMPONENT (Type 3) への応答
  if (interaction.type === DiscordInteractionType.MessageComponent) {
    // OTelコンテキストをキャプチャして非同期処理に伝播
    const capturedCtx = otelContext.active();
    // 非同期でメッセージを更新
    void otelContext.with(capturedCtx, () => handleMessageComponent(interaction));

    logger.debug("Returning deferred update response");
    // まずDeferredレスポンスを即座に返す（3秒制限を守るため）
    return {
      type: InteractionResponseType.DeferredMessageUpdate,
    };
  }

  // その他のInteractionタイプ（今後実装予定）
  logger.warn("Unsupported interaction type", { type: interaction.type });
  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content: "このInteractionタイプはまだ実装されていません。",
    },
  };
};

/**
 * 共通のMessage Components要素を生成
 *
 * @param title - タイトル
 * @returns JSX要素
 */
const DemoComponent = ({ title }: { title: string }) => {
  useInteraction(() => {
    logger.info("Interaction callback executed for message components", {
      title,
    });
  });

  const [count, actions] = useEmbedState(0, {
    increment: (prev) => prev + 1,
    decrement: (prev) => prev - 1,
    reset: () => 0,
  });

  return (
    <Components>
      <Section
        accessory={
          <Button customId="section_button" style="primary">
            アクション
          </Button>
        }
      >
        <TextDisplay>✨ {title}</TextDisplay>
        <TextDisplay>disactを使用してDiscord Message ComponentsをJSXで記述しています！</TextDisplay>
        <TextDisplay>カウント: {`${count}`}</TextDisplay>
      </Section>

      <Separator />

      <ActionRow>
        <Button customId={actions.increment()} style="primary">
          +1
        </Button>
        <Button customId={actions.decrement()} style="success">
          -1
        </Button>
        <Button customId={actions.reset()} style="danger">
          Reset
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
    logger.info("Processing application command", {
      commandName: interaction.data.name,
      interactionId: interaction.id,
    });

    // Sessionを作成
    // ハンドラーで既にDeferredレスポンスを返しているため、deferred: trueを指定
    const session = createSessionFromApplicationCommandInteraction(interaction, {
      ephemeral: false,
      deferred: true,
    });

    // DisactAppを作成
    const app = createDisactApp();

    // 共通のMessage Componentsを生成
    const element = (
      <DemoComponent title={`Hello from disact! (コマンド: /${interaction.data.name})`} />
    );

    // JSXをレンダリングしてSessionに接続
    // これにより自動的にDiscord APIにメッセージが送信される
    await app.connect(session, element);

    logger.info("Application command processed successfully", {
      commandName: interaction.data.name,
    });
  } catch (error) {
    logger.error("Failed to process application command", {
      error,
      commandName: interaction.data.name,
    });
  }
};

/**
 * MESSAGE_COMPONENT Interactionを処理
 *
 * disactAppとSessionを使用してMessage Componentsを更新します。
 *
 * @param interaction - Interactionデータ
 */
const handleMessageComponent = async (
  interaction: APIMessageComponentInteraction,
): Promise<void> => {
  try {
    logger.info("Processing message component", {
      customId: interaction.data.custom_id,
      interactionId: interaction.id,
    });

    // Sessionを作成
    // ハンドラーで既にDeferredレスポンスを返しているため、deferred: trueを指定
    const session = createSessionFromMessageComponentInteraction(interaction, {
      ephemeral: false,
      deferred: true,
    });

    // DisactAppを作成
    const app = createDisactApp();

    // 共通のMessage Componentsを生成
    const element = (
      <DemoComponent
        title={`ボタンがクリックされました！ (customId: ${interaction.data.custom_id})`}
      />
    );

    // JSXをレンダリングしてSessionに接続
    // これにより自動的にDiscord APIでメッセージが更新される
    await app.connect(session, element);

    logger.info("Message component processed successfully", {
      customId: interaction.data.custom_id,
    });
  } catch (error) {
    logger.error("Failed to process message component", {
      error,
      customId: interaction.data.custom_id,
    });
  }
};
