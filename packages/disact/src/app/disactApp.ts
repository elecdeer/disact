import { type DisactElement, renderToReadableStream } from "@disact/engine";
import { toMessageComponentsPayload } from "../components";
import { getDisactLogger } from "../utils/logger";
import { isDifferentPayloadElement } from "./diff";
import type { Session } from "./session";

const logger = getDisactLogger("app");

export type DisactApp = {
  connect: (session: Session, node: DisactElement) => Promise<void>;
};

export const createDisactApp = (): DisactApp => {
  const connect = async (session: Session, rootElement: DisactElement) => {
    logger.debug("Starting app connection", { hasSession: !!session });
    const stream = renderToReadableStream(rootElement, {});

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
