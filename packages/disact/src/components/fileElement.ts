import * as z from "zod";
import { FileComponentForMessageRequestType } from "../api/models";

const unfurledMediaSchema = z.object({
  url: z.string().max(2048),
});

export const fileElementSchema = z
  .object({
    name: z.literal("file"),
    id: z.optional(z.number().int().min(0)),
    spoiler: z.optional(z.boolean()),
    file: unfurledMediaSchema,
  })
  .transform((obj) => ({
    type: FileComponentForMessageRequestType.NUMBER_13,
    id: obj.id,
    spoiler: obj.spoiler,
    file: obj.file,
  }));

export type FileElement = z.input<typeof fileElementSchema>;
