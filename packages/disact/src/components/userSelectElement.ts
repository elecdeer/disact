import type { UndefinedOnPartialDeep } from "type-fest";
import * as z from "zod";
import {
  type UserSelectComponentForMessageRequest,
  UserSelectComponentForMessageRequestType,
} from "../api/models";
import { snowflakeSchema } from "../utils/snowflakeSchema";

export const userSelectElementSchema = z
  .object({
    name: z.literal("userSelect"),
    id: z.optional(z.number().int().min(0)),
    customId: z.string().max(100),
    placeholder: z.optional(z.string().max(150)),
    minValues: z.optional(z.number().int().min(0).max(25)),
    maxValues: z.optional(z.number().int().min(1).max(25)),
    disabled: z.optional(z.boolean()),
    required: z.optional(z.boolean()),
    defaultValues: z.optional(
      z
        .array(
          z.object({
            id: snowflakeSchema,
            type: z.literal("user"),
          }),
        )
        .max(25),
    ),
  })
  .transform(
    (obj): UndefinedOnPartialDeep<UserSelectComponentForMessageRequest> => ({
      type: UserSelectComponentForMessageRequestType.NUMBER_5,
      id: obj.id,
      custom_id: obj.customId,
      placeholder: obj.placeholder,
      min_values: obj.minValues,
      max_values: obj.maxValues,
      disabled: obj.disabled,
      required: obj.required,
      default_values: obj.defaultValues,
    }),
  );

export type UserSelectElement = z.input<typeof userSelectElementSchema>;
