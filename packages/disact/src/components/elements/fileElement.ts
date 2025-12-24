import { type APIFileComponent, ComponentType } from "discord-api-types/v10";
import * as z from "zod";
import { removeUndefined } from "../../utils/removeUndefined";
import { createPropsOnlyComponentSchema } from "./schemaUtils";

export type FileElement = {
  id?: number;
  spoiler?: boolean;
  file: {
    url: string;
  };
};

const unfurledMediaSchema = z.object({
  url: z.string().max(2048),
});

export const fileElementSchema = createPropsOnlyComponentSchema(
  ComponentType.File,
  z.object({
    id: z.optional(z.number().int().min(0)),
    spoiler: z.optional(z.boolean()),
    file: unfurledMediaSchema,
  }),
  (props): APIFileComponent =>
    removeUndefined({
      type: ComponentType.File as const,
      id: props.id,
      spoiler: props.spoiler,
      file: props.file,
    }),
);
