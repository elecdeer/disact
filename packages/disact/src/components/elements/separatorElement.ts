import { type APISeparatorComponent, ComponentType } from "discord-api-types/v10";
import * as z from "zod";
import { removeUndefined } from "../../utils/removeUndefined";
import { createPropsOnlyComponentSchema } from "./schemaUtils";

export const separatorElementSchema = createPropsOnlyComponentSchema(
  ComponentType.Separator,
  z.object({
    id: z.optional(z.number().int().min(0)),
    spacing: z.optional(z.number().nullable()),
    divider: z.optional(z.boolean()),
  }),
  (props): APISeparatorComponent =>
    removeUndefined({
      type: ComponentType.Separator as const,
      id: props.id,
      spacing: props.spacing,
      divider: props.divider,
    }),
);
