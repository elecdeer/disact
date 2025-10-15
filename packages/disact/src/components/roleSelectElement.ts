import type { UndefinedOnPartialDeep } from "type-fest";
import * as z from "zod";
import {
  type RoleSelectComponentForMessageRequest,
  RoleSelectComponentForMessageRequestType,
} from "../api/models";
import { snowflakeSchema } from "../utils/snowflakeSchema";

export type RoleSelectElement = {
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

export const roleSelectElementSchema = z
  .object({
    type: z.literal("intrinsic"),
    name: z.literal("roleSelect"),
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
    (obj): UndefinedOnPartialDeep<RoleSelectComponentForMessageRequest> => ({
      type: RoleSelectComponentForMessageRequestType.NUMBER_6,
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
