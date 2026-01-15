import {
  type DisactElement,
  renderToReadableStream,
  type RenderLifecycleCallbacks,
} from "@disact/engine";
import type {
  APIInteraction,
  APIMessageComponentInteraction,
} from "discord-api-types/v10";
import { InteractionType } from "discord-api-types/v10";
import { toMessageComponentsPayload } from "../components";
import { defaultSerializer, parseCustomId } from "../hooks/customId";
import type { InteractionCallback } from "../hooks/useInteraction";
import type { ReducerContext } from "../hooks/useReducer";
import { extractCustomIds } from "../utils/extractCustomIds";
import { getDisactLogger } from "../utils/logger";
import { isDifferentPayloadElement } from "./diff";
import type { Session } from "./session";

const logger = getDisactLogger("app");

export type DisactApp = {
  connect: <T = APIInteraction>(
    session: Session<T>,
    node: DisactElement,
  ) => Promise<void>;
};

export const createDisactApp = (): DisactApp => {
  const connect = async <T = APIInteraction>(
    session: Session<T>,
    rootElement: DisactElement,
  ) => {
    logger.debug("Starting app connection", { hasSession: !!session });

    // Interactionコールバック配列を用意
    const interactionCallbacks: InteractionCallback<T>[] = [];

    // Reducer状態マップを用意
    const reducerValues = new Map<string, unknown>();

    // Message Component Interactionの場合、既存メッセージから状態を復元
    const interaction = session.getInteraction();
    // interactionがobjectかつ必要なプロパティを持つかチェック
    const isMessageComponentInteraction =
      interaction &&
      typeof interaction === "object" &&
      "type" in interaction &&
      interaction.type === InteractionType.MessageComponent &&
      "message" in interaction &&
      "data" in interaction;

    if (isMessageComponentInteraction) {
      // 実行時に type, message, data プロパティの存在を確認済みのため、型アサーションは安全
      const messageComponentInteraction =
        interaction as unknown as APIMessageComponentInteraction;

      logger.debug("Restoring state from message component interaction");

      // メッセージから全てのcustomIdを抽出
      const customIds = extractCustomIds(messageComponentInteraction.message.components);
      logger.trace("Extracted customIds", { customIds });

      // 全ての現在値をコンテキストにセット
      for (const customId of customIds) {
        const parsed = parseCustomId(customId);
        if (parsed) {
          const value = defaultSerializer.deserialize(parsed.current);
          reducerValues.set(parsed.name, value);
          logger.trace("Restored reducer value", {
            name: parsed.name,
            value,
          });
        }
      }

      // クリックされたcustomIdの値を更新（次の値を採用）
      const clickedParsed = parseCustomId(messageComponentInteraction.data.custom_id);
      if (clickedParsed) {
        const nextValue = defaultSerializer.deserialize(clickedParsed.next);
        reducerValues.set(clickedParsed.name, nextValue);
        logger.debug("Updated clicked reducer value", {
          name: clickedParsed.name,
          nextValue,
        });
      }
    }

    // Contextに配列とreducerValuesを含める
    const context: ReducerContext & { __interactionCallbacks: InteractionCallback<T>[] } = {
      __interactionCallbacks: interactionCallbacks,
      __reducerValues: reducerValues,
    };

    // ライフサイクルフックを定義
    const lifecycleCallbacks: RenderLifecycleCallbacks = {
      preRender: async () => {
        // 各レンダリング前にcallback配列をクリア
        // 最終レンダリングのcallbackのみを保持するため
        interactionCallbacks.length = 0;
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
