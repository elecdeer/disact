import {
  type DisactElement,
  renderToReadableStream,
  type RenderLifecycleCallbacks,
} from "@disact/engine";
import type { APIInteraction } from "discord-api-types/v10";
import { toMessageComponentsPayload } from "../components";
import type { InteractionCallback } from "../hooks/useInteraction";
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

    // Contextに配列を含める
    const context = {
      __interactionCallbacks: interactionCallbacks,
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
