import * as z from "zod";
import { StringSelectComponentForMessageRequestType } from "../api/models";

// StringSelectのオプションスキーマ
export const stringSelectOptionSchema = z.object({
  label: z.string().min(1).max(100),
  value: z.string().min(1).max(100),
  description: z.optional(z.string().max(100)),
  default: z.optional(z.boolean()),
  emoji: z.optional(
    z.object({
      id: z.optional(z.string()),
      name: z.optional(z.string()),
      animated: z.optional(z.boolean()),
    }),
  ),
});

export const stringSelectElementSchema = z
  .object({
    name: z.literal("stringSelect"),
    id: z.optional(z.number().int().min(0)),
    customId: z.string().max(100),
    placeholder: z.optional(z.string().max(150)),
    minValues: z.optional(z.number().int().min(0).max(25)),
    maxValues: z.optional(z.number().int().min(1).max(25)),
    disabled: z.optional(z.boolean()),
    required: z.optional(z.boolean()),
    options: z.array(stringSelectOptionSchema).min(1).max(25),
  })
  .transform((obj) => ({
    type: StringSelectComponentForMessageRequestType.NUMBER_3,
    id: obj.id,
    custom_id: obj.customId,
    placeholder: obj.placeholder,
    min_values: obj.minValues,
    max_values: obj.maxValues,
    disabled: obj.disabled,
    required: obj.required,
    options: obj.options,
  }));

export type StringSelectElement = z.input<typeof stringSelectElementSchema>;
