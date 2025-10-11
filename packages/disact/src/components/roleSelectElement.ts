import * as z from "zod";
import { RoleSelectComponentForMessageRequestType } from "../api/models";

export const roleSelectElementSchema = z
  .object({
    name: z.literal("roleSelect"),
    id: z.optional(z.number().int().min(0)),
    customId: z.string().max(100),
    placeholder: z.optional(z.string().max(150)),
    minValues: z.optional(z.number().int().min(0).max(25)),
    maxValues: z.optional(z.number().int().min(1).max(25)),
    disabled: z.optional(z.boolean()),
    required: z.optional(z.boolean()),
    defaultValues: z.optional(z.array(z.string()).max(25)),
  })
  .transform((obj) => ({
    type: RoleSelectComponentForMessageRequestType.NUMBER_6,
    id: obj.id,
    custom_id: obj.customId,
    placeholder: obj.placeholder,
    min_values: obj.minValues,
    max_values: obj.maxValues,
    disabled: obj.disabled,
    required: obj.required,
    default_values: obj.defaultValues,
  }));

export type RoleSelectElement = z.input<typeof roleSelectElementSchema>;
