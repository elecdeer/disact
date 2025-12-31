import type { APIInteraction } from "discord-api-types/v10";
import type { PayloadElements } from "../components/index.ts";

export type Session<T = APIInteraction> = {
  commit: (payload: PayloadElements) => Promise<void>;
  getCurrent: () => Promise<PayloadElements | null>;
  getInteraction: () => T | undefined;
};
