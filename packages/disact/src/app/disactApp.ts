import {
  type DisactElement,
  renderToReadableStream,
  type RenderLifecycleCallbacks,
} from "@disact/engine";
import type { APIInteraction, APIMessageComponentInteraction } from "discord-api-types/v10";
import { InteractionType } from "discord-api-types/v10";
import { toMessageComponentsPayload } from "../components";
import type { InteractionCallback } from "../hooks/useInteraction";
import { isDisactCustomId, parseCustomId } from "../state/customId";
import type { EmbedStateContext } from "../state/embedStateContext";
import { getDisactLogger } from "../utils/logger";
import { isDifferentPayloadElement } from "./diff";
import type { Session } from "./session";

const logger = getDisactLogger("app");

export type DisactApp = {
  connect: <T = APIInteraction>(session: Session<T>, node: DisactElement) => Promise<void>;
};

export const createDisactApp = (): DisactApp => {
  const connect = async <T = APIInteraction>(session: Session<T>, rootElement: DisactElement) => {
    logger.debug("Starting app connection", { hasSession: !!session });

    // Interactionコールバック配列を用意
    const interactionCallbacks: InteractionCallback<T>[] = [];

    // Contextに配列を含める（EmbedState用のフィールドも追加）
    const context: EmbedStateContext & { __interactionCallbacks: InteractionCallback<T>[] } = {
      __interactionCallbacks: interactionCallbacks,
      __embedStateIdCounter: 0,
      __embedStateReducers: new Map(),
    };

    // Message Component Interaction の場合、customId を解析
    const interaction = session.getInteraction();
    if (interaction && isMessageComponentInteraction(interaction)) {
      const customId = interaction.data.custom_id;

      if (isDisactCustomId(customId)) {
        const parsed = parseCustomId(customId);
        if (parsed) {
          logger.debug("Disact customId detected", {
            hookId: parsed.hookId,
            action: parsed.action,
          });

          // トリガー情報をコンテキストに設定
          context.__embedStateTriggered = {
            hookId: parsed.hookId,
            action: parsed.action,
            prevState: parsed.prevState,
          };

          // interaction をコンテキストに設定（reducer 実行時に使用）
          context.__embedStateInteraction = interaction;
        }
      }
    }

    // ライフサイクルフックを定義
    const lifecycleCallbacks: RenderLifecycleCallbacks = {
      preRender: async () => {
        // 各レンダリング前にcallback配列をクリア
        // 最終レンダリングのcallbackのみを保持するため
        interactionCallbacks.length = 0;
        // hookId カウンターをリセット（再レンダリング時に同じ hookId を生成するため）
        context.__embedStateIdCounter = 0;
      },
      postRenderCycle: async () => {
        // 全レンダリング完了後、callbackを実行
        const interaction = session.getInteraction();
        if (interaction && interactionCallbacks.length > 0) {
          logger.debug("Executing interaction callbacks", {
            count: interactionCallbacks.length,
          });

          for (const callback of interactionCallbacks) {
            try {
              await callback(interaction);
            } catch (error) {
              logger.error("Interaction callback failed", { error });
              // エラーが発生しても続行
            }
          }
        }
      },
    };

    const stream = renderToReadableStream(rootElement, context, lifecycleCallbacks);

    void (async () => {
      let chunkCount = 0;

      for await (const chunk of stream) {
        chunkCount++;
        logger.debug("Processing render chunk", {
          chunkCount,
          chunk,
        });

        const current = await session.getCurrent();
        logger.debug("Current session state", {
          hasCurrent: current !== null,
          current,
        });

        const chunkPayload = toMessageComponentsPayload(chunk);
        logger.debug("Converted to payload", {
          chunkCount,
          payload: chunkPayload,
        });

        // 差分がない場合はスキップ（currentがnullの場合は初回なので必ずcommit）
        if (current !== null && !isDifferentPayloadElement(current, chunkPayload)) {
          logger.debug("Skipping chunk (no diff detected)", {
            chunkCount,
            current,
            payload: chunkPayload,
          });
          continue;
        }

        logger.info("Committing chunk to session", {
          chunkCount,
          isInitial: current === null,
          payload: chunkPayload,
        });
        await session.commit(chunkPayload);
      }
      logger.info("App connection completed", { totalChunks: chunkCount });
    })();
  };

  return {
    connect,
  };
};

/**
 * Interaction が Message Component Interaction かどうかを判定
 */
const isMessageComponentInteraction = (
  interaction: unknown,
): interaction is APIMessageComponentInteraction => {
  return (
    typeof interaction === "object" &&
    interaction !== null &&
    "type" in interaction &&
    (interaction as { type: number }).type === InteractionType.MessageComponent
  );
};
