import {
  type APIRoleSelectComponent,
  ComponentType,
  SelectMenuDefaultValueType,
} from "discord-api-types/v10";
import * as z from "zod";
import { removeUndefined } from "../utils/removeUndefined.js";
import { snowflakeSchema } from "../utils/snowflakeSchema.js";

export type RoleSelectProps = {
  id?: number;
  customId: string;
  placeholder?: string;
  minValues?: number;
  maxValues?: number;
  disabled?: boolean;
  required?: boolean;
  defaultValues?: Array<{
    id: string;
    type: "role";
  }>;
};

/**
 * RoleSelect Core Component
 *
 * @see https://discord.com/developers/docs/components/reference#role-select
 */
export const RoleSelect = (props: RoleSelectProps) => {
  return <roleSelect {...props} />;
};

export const roleSelectElementSchema = z
  .object({
    type: z.literal("roleSelect"),

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
              type: z.literal("role"),
            }),
          )
          .max(25),
      ),
    }),
    children: z.null(),
  })
  .transform(
    (obj): APIRoleSelectComponent =>
      removeUndefined({
        type: ComponentType.RoleSelect as const,
        id: obj.props.id,
        custom_id: obj.props.customId,
        placeholder: obj.props.placeholder,
        min_values: obj.props.minValues,
        max_values: obj.props.maxValues,
        disabled: obj.props.disabled,
        required: obj.props.required,
        default_values: obj.props.defaultValues?.map((item) => ({
          id: item.id,
          type: SelectMenuDefaultValueType.Role as const,
        })),
      }),
  );
