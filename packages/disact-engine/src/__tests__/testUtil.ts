import type { RenderedElement } from "../element";

/**
 * ストリームから結果を読み取るヘルパー関数
 */
export const readStreamToCompletion = async (
  stream: ReadableStream,
): Promise<(RenderedElement | RenderedElement[] | null)[]> => {
  const reader = stream.getReader();
  const chunks: (RenderedElement | RenderedElement[] | null)[] = [];

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  return chunks;
};
