import type { PayloadElements } from "../components/index.ts";

export type Session<T = unknown> = {
  commit: (payload: PayloadElements) => Promise<void>;
  getCurrent: () => Promise<PayloadElements | null>;
  getInteraction: () => T | undefined;
};
