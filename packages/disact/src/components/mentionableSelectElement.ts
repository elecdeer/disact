import type { UndefinedOnPartialDeep } from "type-fest";
import * as z from "zod";
import {
  type MentionableSelectComponentForMessageRequest,
  MentionableSelectComponentForMessageRequestType,
} from "../api/models";

export const mentionableSelectElementSchema = z
  .object({
    name: z.literal("mentionableSelect"),
    id: z.optional(z.number().int().min(0)),
    customId: z.string().max(100),
    placeholder: z.optional(z.string().max(150)),
    minValues: z.optional(z.number().int().min(0).max(25)),
    maxValues: z.optional(z.number().int().min(1).max(25)),
    disabled: z.optional(z.boolean()),
    required: z.optional(z.boolean()),
    defaultValues: z.optional(z.array(z.string()).max(25)),
  })
  .transform(
    (
      obj,
    ): UndefinedOnPartialDeep<MentionableSelectComponentForMessageRequest> => ({
      type: MentionableSelectComponentForMessageRequestType.NUMBER_7,
      id: obj.id,
      custom_id: obj.customId,
      placeholder: obj.placeholder,
      min_values: obj.minValues,
      max_values: obj.maxValues,
      disabled: obj.disabled,
      required: obj.required,
    }),
  );

export type MentionableSelectElement = z.input<
  typeof mentionableSelectElementSchema
>;
