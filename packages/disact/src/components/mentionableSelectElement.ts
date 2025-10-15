import type { UndefinedOnPartialDeep } from "type-fest";
import * as z from "zod";
import {
  type MentionableSelectComponentForMessageRequest,
  MentionableSelectComponentForMessageRequestType,
} from "../api/models";
import { snowflakeSchema } from "../utils/snowflakeSchema";

export const mentionableSelectElementSchema = z
  .object({
    type: z.literal("intrinsic"),
    name: z.literal("mentionableSelect"),
    props: z.object({
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
              type: z.enum(["user", "role"]),
            }),
          )
          .max(25),
      ),
    }),
    children: z.null(),
  })
  .transform(
    (
      obj,
    ): UndefinedOnPartialDeep<MentionableSelectComponentForMessageRequest> => ({
      type: MentionableSelectComponentForMessageRequestType.NUMBER_7,
      id: obj.props.id,
      custom_id: obj.props.customId,
      placeholder: obj.props.placeholder,
      min_values: obj.props.minValues,
      max_values: obj.props.maxValues,
      disabled: obj.props.disabled,
      required: obj.props.required,
      default_values: obj.props.defaultValues,
    }),
  );

export type MentionableSelectElement = z.input<
  typeof mentionableSelectElementSchema
>;
