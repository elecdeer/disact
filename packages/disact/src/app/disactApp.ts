import { type DisactElement, renderToReadableStream } from "@disact/engine";
import { toPayload } from "../components";
import { isDifferentPayloadElement } from "./diff";
import type { Session } from "./session";

export type DisactApp = {
  connect: (session: Session, node: DisactElement) => Promise<void>;
};

export const createDisactApp = (): DisactApp => {
  const connect = async (session: Session, rootElement: DisactElement) => {
    const stream = renderToReadableStream(rootElement, {});

    void (async () => {
      for await (const chunk of stream) {
        if (chunk === null || Array.isArray(chunk)) {
          throw new Error("Unexpected chunk format");
        }

        const current = await session.getCurrent();
        const chunkPayload = toPayload(chunk);
        // 差分がない場合はスキップ
        if (!isDifferentPayloadElement(current, chunkPayload)) {
          continue;
        }

        await session.commit(chunkPayload);
      }
    })();
  };

  return {
    connect,
  };
};
