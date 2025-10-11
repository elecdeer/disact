import * as z from "zod";
import { SeparatorComponentForMessageRequestType } from "../api/models";

export const separatorElementSchema = z
  .object({
    name: z.literal("separator"),
    id: z.optional(z.number().int().min(0)),
    spacing: z.optional(z.number().nullable()),
    divider: z.optional(z.boolean()),
  })
  .transform((obj) => ({
    type: SeparatorComponentForMessageRequestType.NUMBER_14,
    id: obj.id,
    spacing: obj.spacing,
    divider: obj.divider,
  }));

export type SeparatorElement = z.input<typeof separatorElementSchema>;
