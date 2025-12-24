import { type APIThumbnailComponent, ComponentType } from "discord-api-types/v10";
import * as z from "zod";
import { removeUndefined } from "../../utils/removeUndefined";
import { createPropsOnlyComponentSchema } from "./schemaUtils";

export type ThumbnailElement = {
  id?: number;
  description?: string;
  spoiler?: boolean;
  media: {
    url: string;
  };
};

export const thumbnailElementSchema = createPropsOnlyComponentSchema(
  ComponentType.Thumbnail,
  z.object({
    id: z.optional(z.number().int().min(0)),
    description: z.optional(z.string().min(1).max(1024)),
    spoiler: z.optional(z.boolean()),
    media: z.object({
      url: z.string().max(2048),
    }),
  }),
  (props): APIThumbnailComponent =>
    removeUndefined({
      type: ComponentType.Thumbnail as const,
      id: props.id,
      description: props.description ?? null,
      spoiler: props.spoiler,
      media: props.media,
    }),
);
