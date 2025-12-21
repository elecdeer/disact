import { type APISeparatorComponent, ComponentType } from "discord-api-types/v10";
import * as z from "zod";
import { removeUndefined } from "../utils/removeUndefined";

export type SeparatorElement = {
  id?: number;
  spacing?: number | null;
  divider?: boolean;
};

export const separatorElementSchema = z
  .object({
    type: z.literal("intrinsic"),
    name: z.literal("separator"),
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
