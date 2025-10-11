import * as z from "zod";
import { TextDisplayComponentForMessageRequestType } from "../api/models";

export const textDisplayElementSchema = z
  .object({
    name: z.literal("textDisplay"),
    id: z.optional(z.number().int().min(0)),
    content: z.string().min(1).max(4000),
  })
  .transform((obj) => ({
    type: TextDisplayComponentForMessageRequestType.NUMBER_10,
    id: obj.id,
    content: obj.content,
  }));

export type TextDisplayElement = z.input<typeof textDisplayElementSchema>;
