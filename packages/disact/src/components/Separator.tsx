import {
  type APISeparatorComponent,
  ComponentType,
} from "discord-api-types/v10";
import * as z from "zod";
import { removeUndefined } from "../utils/removeUndefined.js";

export type SeparatorProps = {
  id?: number;
  spacing?: number | null;
  divider?: boolean;
};

/**
 * Separator Core Component
 *
 * @see https://discord.com/developers/docs/components/reference#separator
 */
export const Separator = (props: SeparatorProps) => {
  return <separator {...props} />;
};

export const separatorElementSchema = z
  .object({
    type: z.literal("separator"),

    props: z.object({
      id: z.optional(z.number().int().min(0)),
      spacing: z.optional(z.number().nullable()),
      divider: z.optional(z.boolean()),
    }),
    children: z.null(),
  })
  .transform(
    (obj): APISeparatorComponent =>
      removeUndefined({
        type: ComponentType.Separator as const,
        id: obj.props.id,
        spacing: obj.props.spacing,
        divider: obj.props.divider,
      }),
  );
