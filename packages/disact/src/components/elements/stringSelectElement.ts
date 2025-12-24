import { type APIStringSelectComponent, ComponentType } from "discord-api-types/v10";
import * as z from "zod";
import { removeUndefined } from "../../utils/removeUndefined";
import { createPropsOnlyComponentSchema } from "./schemaUtils";

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

export const stringSelectElementSchema = createPropsOnlyComponentSchema(
  ComponentType.StringSelect,
  z.object({
    id: z.optional(z.number().int().min(0)),
    customId: z.string().max(100),
    placeholder: z.optional(z.string().max(150)),
    minValues: z.optional(z.number().int().min(0).max(25)),
    maxValues: z.optional(z.number().int().min(1).max(25)),
    disabled: z.optional(z.boolean()),
    required: z.optional(z.boolean()),
    options: z.array(stringSelectOptionSchema).min(1).max(25),
  }),
  (props): APIStringSelectComponent =>
    removeUndefined({
      type: ComponentType.StringSelect as const,
      id: props.id,
      custom_id: props.customId,
      placeholder: props.placeholder,
      min_values: props.minValues,
      max_values: props.maxValues,
      disabled: props.disabled,
      required: props.required,
      options: props.options.map((option) =>
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
