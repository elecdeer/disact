import type { PayloadElements } from "../components/index.ts";

export type Session = {
  commit: (payload: PayloadElements) => Promise<void>;
  getCurrent: () => Promise<PayloadElements | null>;
};
