import {
  type APIUserSelectComponent,
  ComponentType,
  SelectMenuDefaultValueType,
} from "discord-api-types/v10";
import * as z from "zod";
import { removeUndefined } from "../../utils/removeUndefined";
import { snowflakeSchema } from "../../utils/snowflakeSchema";
import { createPropsOnlyComponentSchema } from "./schemaUtils";

export type UserSelectElement = {
  id?: number;
  customId: string;
  placeholder?: string;
  minValues?: number;
  maxValues?: number;
  disabled?: boolean;
  required?: boolean;
  defaultValues?: Array<{
    id: string;
    type: "user";
  }>;
};

export const userSelectElementSchema = createPropsOnlyComponentSchema(
  ComponentType.UserSelect,
  z.object({
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
  }),
  (props): APIUserSelectComponent =>
    removeUndefined({
      type: ComponentType.UserSelect as const,
      id: props.id,
      custom_id: props.customId,
      placeholder: props.placeholder,
      min_values: props.minValues,
      max_values: props.maxValues,
      disabled: props.disabled,
      required: props.required,
      default_values: props.defaultValues?.map((item) => ({
        id: item.id,
        type: SelectMenuDefaultValueType.User as const,
      })),
    }),
);
