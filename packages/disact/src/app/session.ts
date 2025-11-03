import type { PayloadElement } from "../components/index.ts";

export type Session = {
  commit: (payload: PayloadElement) => Promise<void>;
  getCurrent: () => Promise<PayloadElement>;
};
