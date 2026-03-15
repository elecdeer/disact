import {
  type DisactElement,
  renderToReadableStream,
  type RenderLifecycleCallbacks,
  type RenderStreamOptions,
} from "@disact/engine";
import { SpanStatusCode, context as otelContext } from "@opentelemetry/api";
import type { APIInteraction } from "discord-api-types/v10";
import { toMessageComponentsPayload } from "../components";
import type { InteractionCallback, InteractionCallbacksContext } from "../hooks/useInteraction";
import type { EmbedStateContext } from "../state/embedStateContext";
import { getDisactLogger } from "../utils/logger";
import { getDisactTracer } from "../utils/tracer";
import { isDifferentPayloadElement } from "./diff";
import type { Session } from "./session";

const logger = getDisactLogger("app");

/**
 * connect() が返すインスタンス。インタラクションの処理に使用する。
 */
export type DisactAppInstance<T = APIInteraction> = {
  /**
   * インタラクションを処理する。
   * コンテキストにインタラクションをセットして再レンダリングし、
   * 安定状態到達後に useInteraction コールバックを実行してresolveする。
   *
   * @param interaction - 処理するインタラクション
   */
  handleInteraction: (interaction: T) => Promise<void>;

  /**
   * インタラクションなしで再レンダリングを強制する。
   * stable状態到達後にresolveする。
   * useInteraction コールバックは実行されない。
   */
  rerender: () => Promise<void>;

  /**
   * ストリームを明示的に閉じる。
   * スケジューラーを破棄してレンダリングストリームをクローズする。
   * 使い終わったら呼び出してリソースを解放する。
   */
  close: () => void;
};

/**
 * DisactApp インターフェース
 */
export type DisactApp = {
  /**
   * セッションとルート要素を接続し、初回レンダリングが安定状態に達するまで待機する。
   *
   * @param session - Discord セッション
   * @param node - レンダリングするルート要素
   * @returns インタラクション処理に使用するインスタンス
   */
  connect: <T = APIInteraction>(
    session: Session,
    node: DisactElement,
  ) => Promise<DisactAppInstance<T>>;
};

export const createDisactApp = (): DisactApp => {
  const connect = async <T = APIInteraction>(
    session: Session,
    rootElement: DisactElement,
  ): Promise<DisactAppInstance<T>> => {
    const tracer = getDisactTracer();
    logger.debug("Starting app connection", { hasSession: !!session });

    // Interactionコールバック配列を用意
    const interactionCallbacks: InteractionCallback<T>[] = [];

    // コールバック実行済みフラグ（各 handleInteraction 呼び出しに対して1回のみ実行）
    let callbacksExecuted = false;

    // 現在処理中のインタラクション
    let currentInteraction: T | undefined = undefined;

    // Contextに配列を含める（EmbedState用のフィールドも追加）
    const context: EmbedStateContext & InteractionCallbacksContext<T> = {
      __interactionCallbacks: interactionCallbacks,
      __embedStateInstanceCounter: 0,
    };

    // requestRerender関数の参照（preRenderで取得）
    let requestRerenderFn: (() => void) | undefined;

    // close関数の参照（preRenderで取得）
    let closeFn: (() => void) | undefined;

    // 安定状態到達時にresolveするPromise管理
    let resolveStable: (() => void) | undefined;
    let stablePromise = new Promise<void>((resolve) => {
      resolveStable = resolve;
    });

    /**
     * 次のstable到達のためにPromiseを更新する。
     * 現在のresolve関数を取り出してからPromiseを差し替えることで、
     * awaitしている側が古いPromiseを待ち続けられるようにする。
     */
    const resolveAndRenewStable = () => {
      const resolve = resolveStable;
      stablePromise = new Promise<void>((r) => {
        resolveStable = r;
      });
      resolve?.();
    };

    // ライフサイクルフックを定義
    const lifecycleCallbacks: RenderLifecycleCallbacks = {
      preRender: async (helpers) => {
        // requestRerender関数とclose関数を取得（初回preRenderで設定される）
        requestRerenderFn = helpers.requestRerender;
        closeFn = helpers.close;

        // 各レンダリング前にcallback配列をクリア（最終レンダリングのcallbackのみを保持するため）
        interactionCallbacks.length = 0;
        // instance カウンターをリセット（再レンダリング時に同じ instanceId を生成するため）
        context.__embedStateInstanceCounter = 0;

        // 現在のinteractionをコンテキストに設定
        if (currentInteraction !== undefined) {
          context.__interaction = currentInteraction;
        } else {
          delete (context as InteractionCallbacksContext<T>).__interaction;
        }
      },
      onStable: async () => {
        // インタラクションコールバックを実行（各handleInteraction呼び出しに対して1回のみ）
        if (
          !callbacksExecuted &&
          currentInteraction !== undefined &&
          interactionCallbacks.length > 0
        ) {
          callbacksExecuted = true;
          await tracer.startActiveSpan("disact.interaction.callbacks", async (callbacksSpan) => {
            try {
              logger.debug("Executing interaction callbacks", {
                count: interactionCallbacks.length,
              });
              callbacksSpan.setAttribute("disact.callbacks.count", interactionCallbacks.length);

              for (const callback of interactionCallbacks) {
                try {
                  await callback(currentInteraction as T);
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

        // stable到達を通知（次のhandleInteraction用にPromiseを更新）
        resolveAndRenewStable();
      },
      postRenderCycle: async () => {
        // streamが終了する場合もstableのPromiseをresolve
        resolveAndRenewStable();
      },
    };

    const streamOptions: RenderStreamOptions = { keepAlive: true };
    const stream = renderToReadableStream(rootElement, context, lifecycleCallbacks, streamOptions);

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
    });

    // 初回stableまで待機
    await stablePromise;

    /**
     * インタラクションを処理する。
     * コールバックは各呼び出しに対して1回のみ実行される。
     */
    const handleInteraction = async (interaction: T): Promise<void> => {
      if (!requestRerenderFn) {
        throw new Error("App not properly initialized");
      }

      // コールバック実行済みフラグとinteractionをリセット
      callbacksExecuted = false;
      currentInteraction = interaction;

      // 再レンダリングをトリガー
      requestRerenderFn();

      // stable到達まで待機
      await stablePromise;
    };

    /**
     * インタラクションなしで再レンダリングを強制する。
     * useInteraction コールバックは実行されない（currentInteraction が undefined のまま）。
     */
    const rerender = async (): Promise<void> => {
      if (!requestRerenderFn) {
        throw new Error("App not properly initialized");
      }
      requestRerenderFn();
      await stablePromise;
    };

    /**
     * ストリームを明示的に閉じる。
     * スケジューラーを破棄してレンダリングストリームをクローズする。
     */
    const close = (): void => {
      closeFn?.();
    };

    return { handleInteraction, rerender, close };
  };

  return { connect };
};
