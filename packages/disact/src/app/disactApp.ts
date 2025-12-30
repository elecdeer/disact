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
        logger.trace("Processing render chunk", { chunkCount });

        const current = await session.getCurrent();
        const chunkPayload = toMessageComponentsPayload(chunk);
        // 差分がない場合はスキップ（currentがnullの場合は初回なので必ずcommit）
        if (current !== null && !isDifferentPayloadElement(current, chunkPayload)) {
          logger.debug("Skipping chunk (no diff detected)", { chunkCount });
          continue;
        }

        logger.debug("Committing chunk to session", {
          chunkCount,
          isInitial: current === null,
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
