import type { UndefinedOnPartialDeep } from "type-fest";
import * as z from "zod";
import {
  type TextDisplayComponentForMessageRequest,
  TextDisplayComponentForMessageRequestType,
} from "../api/models";

export const textDisplayElementSchema = z
  .object({
    name: z.literal("textDisplay"),
    id: z.optional(z.number().int().min(0)),
    children: z.string().min(1).max(4000),
  })
  .transform(
    (obj): UndefinedOnPartialDeep<TextDisplayComponentForMessageRequest> => ({
      type: TextDisplayComponentForMessageRequestType.NUMBER_10,
      id: obj.id,
      content: obj.children,
    }),
  );

export type TextDisplayElement = z.input<typeof textDisplayElementSchema>;
