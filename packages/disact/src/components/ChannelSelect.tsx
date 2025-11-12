import {
  type APIChannelSelectComponent,
  type ChannelType,
  ComponentType,
  SelectMenuDefaultValueType,
} from "discord-api-types/v10";
import * as z from "zod";
import { removeUndefined } from "../utils/removeUndefined.js";
import { snowflakeSchema } from "../utils/snowflakeSchema.js";

export type ChannelSelectProps = {
  id?: number;
  customId: string;
  placeholder?: string;
  minValues?: number;
  maxValues?: number;
  disabled?: boolean;
  required?: boolean;
  channelTypes?: ChannelType[];
  defaultValues?: Array<{
    id: string;
    type: "channel";
  }>;
};

/**
 * ChannelSelect Core Component
 *
 * @see https://discord.com/developers/docs/components/reference#channel-select
 */
export const ChannelSelect = (props: ChannelSelectProps) => {
  return <channelSelect {...props} />;
};

export const channelSelectElementSchema = z
  .object({
    type: z.literal("channelSelect"),

    props: z.object({
      id: z.optional(z.number().int().min(0)),
      customId: z.string().max(100),
      placeholder: z.optional(z.string().max(150)),
      minValues: z.optional(z.number().int().min(0).max(25)),
      maxValues: z.optional(z.number().int().min(1).max(25)),
      disabled: z.optional(z.boolean()),
      required: z.optional(z.boolean()),
      channelTypes: z.optional(z.array(z.number())),
      defaultValues: z.optional(
        z
          .array(
            z.object({
              id: snowflakeSchema,
              type: z.literal("channel"),
            }),
          )
          .max(25),
      ),
    }),
    children: z.null(),
  })
  .transform(
    (obj): APIChannelSelectComponent =>
      removeUndefined({
        type: ComponentType.ChannelSelect as const,
        id: obj.props.id,
        custom_id: obj.props.customId,
        placeholder: obj.props.placeholder,
        min_values: obj.props.minValues,
        max_values: obj.props.maxValues,
        disabled: obj.props.disabled,
        required: obj.props.required,
        channel_types: obj.props.channelTypes,
        default_values: obj.props.defaultValues?.map((item) => ({
          id: item.id,
          type: SelectMenuDefaultValueType.Channel as const,
        })),
      }),
  );
