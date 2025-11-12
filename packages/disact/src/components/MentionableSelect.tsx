import {
  type APIMentionableSelectComponent,
  ComponentType,
  SelectMenuDefaultValueType,
} from "discord-api-types/v10";
import * as z from "zod";
import { removeUndefined } from "../utils/removeUndefined.js";
import { snowflakeSchema } from "../utils/snowflakeSchema.js";

export type MentionableSelectProps = {
  id?: number;
  customId: string;
  placeholder?: string;
  minValues?: number;
  maxValues?: number;
  disabled?: boolean;
  required?: boolean;
  defaultValues?: Array<{
    id: string;
    type: "user" | "role";
  }>;
};

/**
 * MentionableSelect Core Component
 *
 * @see https://discord.com/developers/docs/components/reference#mentionable-select
 */
export const MentionableSelect = (props: MentionableSelectProps) => {
  return <mentionableSelect {...props} />;
};

export const mentionableSelectElementSchema = z
  .object({
    type: z.literal("mentionableSelect"),

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
              type: z.union([z.literal("user"), z.literal("role")]),
            }),
          )
          .max(25),
      ),
    }),
    children: z.null(),
  })
  .transform(
    (obj): APIMentionableSelectComponent =>
      removeUndefined({
        type: ComponentType.MentionableSelect as const,
        id: obj.props.id,
        custom_id: obj.props.customId,
        placeholder: obj.props.placeholder,
        min_values: obj.props.minValues,
        max_values: obj.props.maxValues,
        disabled: obj.props.disabled,
        required: obj.props.required,
        default_values: obj.props.defaultValues?.map((item) => ({
          id: item.id,
          type:
            item.type === "user"
              ? (SelectMenuDefaultValueType.User as const)
              : (SelectMenuDefaultValueType.Role as const),
        })),
      }),
  );
