import {
  type DisactElement,
  renderToReadableStream,
  type RenderLifecycleCallbacks,
} from "@disact/engine";
import { SpanStatusCode, context as otelContext, trace } from "@opentelemetry/api";
import type { APIInteraction } from "discord-api-types/v10";
import { toMessageComponentsPayload } from "../components";
import type { InteractionCallback, InteractionCallbacksContext } from "../hooks/useInteraction";
import type { EmbedStateContext } from "../state/embedStateContext";
import { getDisactLogger } from "../utils/logger";
import { getDisactTracer } from "../utils/tracer";
import { isDifferentPayloadElement } from "./diff";
import type { Session } from "./session";

const logger = getDisactLogger("app");

export type DisactApp = {
  connect: <T = APIInteraction>(session: Session<T>, node: DisactElement) => Promise<void>;
};

export const createDisactApp = (): DisactApp => {
  const connect = async <T = APIInteraction>(session: Session<T>, rootElement: DisactElement) => {
    const tracer = getDisactTracer();

    await tracer.startActiveSpan(
      "disact.app.connect",
      {
        attributes: {
          "disact.interaction.id": (session.getInteraction() as APIInteraction | undefined)?.id,
          "disact.interaction.type": (session.getInteraction() as APIInteraction | undefined)?.type,
        },
      },
      async (connectSpan) => {
        try {
          logger.debug("Starting app connection", { hasSession: !!session });

          // Interactionコールバック配列を用意
          const interactionCallbacks: InteractionCallback<T>[] = [];

          // 現在の interaction を取得
          const interaction = session.getInteraction();

          // Contextに配列を含める（EmbedState用のフィールドも追加）
          const context: EmbedStateContext & InteractionCallbacksContext<T> = {
            __interactionCallbacks: interactionCallbacks,
            __embedStateInstanceCounter: 0,
          };

          // interaction が存在する場合はコンテキストに設定
          if (interaction) {
            context.__interaction = interaction;
          }

          // ライフサイクルフックを定義
          const lifecycleCallbacks: RenderLifecycleCallbacks = {
            preRender: async () => {
              // 各レンダリング前にcallback配列をクリア
              // 最終レンダリングのcallbackのみを保持するため
              interactionCallbacks.length = 0;
              // instance カウンターをリセット（再レンダリング時に同じ instanceId を生成するため）
              context.__embedStateInstanceCounter = 0;
            },
            postRenderCycle: async () => {
              // 全レンダリング完了後、callbackを実行
              const interaction = session.getInteraction();
              if (interaction && interactionCallbacks.length > 0) {
                await tracer.startActiveSpan("disact.interaction.callbacks", async (callbacksSpan) => {
                  try {
                    logger.debug("Executing interaction callbacks", {
                      count: interactionCallbacks.length,
                    });
                    callbacksSpan.setAttribute("disact.callbacks.count", interactionCallbacks.length);

                    for (const callback of interactionCallbacks) {
                      try {
                        await callback(interaction);
                      } catch (error) {
                        logger.error("Interaction callback failed", { error });
                        // エラーが発生しても続行
                      }
                    }
                  } finally {
                    callbacksSpan.end();
                  }
                });
              }
            },
          };

          const stream = renderToReadableStream(rootElement, context, lifecycleCallbacks);

          // fire-and-forget IIFEの前にOTelコンテキストをキャプチャ
          const capturedCtx = otelContext.active();

          void otelContext.with(capturedCtx, async () => {
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

              await tracer.startActiveSpan(
                "disact.session.commit",
                {
                  attributes: {
                    "disact.commit.chunk_count": chunkCount,
                    "disact.commit.is_initial": current === null,
                  },
                },
                async (commitSpan) => {
                  try {
                    logger.info("Committing chunk to session", {
                      chunkCount,
                      isInitial: current === null,
                      payload: chunkPayload,
                    });
                    await session.commit(chunkPayload);
                  } catch (error) {
                    commitSpan.setStatus({ code: SpanStatusCode.ERROR });
                    commitSpan.recordException(error instanceof Error ? error : new Error(String(error)));
                    throw error;
                  } finally {
                    commitSpan.end();
                  }
                },
              );
            }
            logger.info("App connection completed", { totalChunks: chunkCount });
            connectSpan.end();
          });
        } catch (error) {
          connectSpan.setStatus({ code: SpanStatusCode.ERROR });
          connectSpan.recordException(error instanceof Error ? error : new Error(String(error)));
          connectSpan.end();
          throw error;
        }
      },
    );
  };
  return {
    connect,
  };
};
