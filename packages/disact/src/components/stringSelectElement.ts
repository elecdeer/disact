import { type APIStringSelectComponent, ComponentType } from "discord-api-types/v10";
import * as z from "zod";
import { removeUndefined } from "../utils/removeUndefined";

// StringSelectのオプションスキーマ
export const stringSelectOptionSchema = z.object({
  label: z.string().min(1).max(100),
  value: z.string().min(1).max(100),
  description: z.optional(z.string().max(100)),
  default: z.optional(z.boolean()),
  emoji: z.optional(
    z.object({
      id: z.optional(z.string()),
      name: z.string(),
    }),
  ),
});

export type StringSelectElement = {
  id?: number;
  customId: string;
  placeholder?: string;
  minValues?: number;
  maxValues?: number;
  disabled?: boolean;
  required?: boolean;
  options: Array<{
    label: string;
    value: string;
    description?: string;
    default?: boolean;
    emoji?: {
      id?: string;
      name: string;
    };
  }>;
};

export const stringSelectElementSchema = z
  .object({
    type: z.literal("intrinsic"),
    name: z.literal("stringSelect"),
    props: z.object({
      id: z.optional(z.number().int().min(0)),
      customId: z.string().max(100),
      placeholder: z.optional(z.string().max(150)),
      minValues: z.optional(z.number().int().min(0).max(25)),
      maxValues: z.optional(z.number().int().min(1).max(25)),
      disabled: z.optional(z.boolean()),
      required: z.optional(z.boolean()),
      options: z.array(stringSelectOptionSchema).min(1).max(25),
    }),
    children: z.null(),
  })
  .transform(
    (obj): APIStringSelectComponent =>
      removeUndefined({
        type: ComponentType.StringSelect as const,
        id: obj.props.id,
        custom_id: obj.props.customId,
        placeholder: obj.props.placeholder,
        min_values: obj.props.minValues,
        max_values: obj.props.maxValues,
        disabled: obj.props.disabled,
        required: obj.props.required,
        options: obj.props.options.map((option) =>
          removeUndefined({
            label: option.label,
            value: option.value,
            description: option.description,
            default: option.default,
            emoji: option.emoji
              ? removeUndefined({
                  id: option.emoji.id,
                  name: option.emoji.name,
                })
              : undefined,
          }),
        ),
      }),
  );
