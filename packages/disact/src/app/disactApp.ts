import { type DisactElement, renderToReadableStream } from "@disact/engine";
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
        if (chunk === null)
          throw new Error("Received null chunk from render stream");

        const current = await session.getCurrent();
        // 差分がない場合はスキップ
        if (!isDifferentPayloadElement(current, chunk)) {
          continue;
        }

        await session.commit(chunk);
      }
    })();
  };

  return {
    connect,
  };
};
