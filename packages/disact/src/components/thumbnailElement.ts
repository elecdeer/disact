import {
  type APIThumbnailComponent,
  ComponentType,
} from "discord-api-types/v10";
import * as z from "zod";
import { removeUndefined } from "../utils/removeUndefined";

export type ThumbnailElement = {
  id?: number;
  description?: string;
  spoiler?: boolean;
  media: {
    url: string;
  };
};

export const thumbnailElementSchema = z
  .object({
    type: z.literal("intrinsic"),
    name: z.literal("thumbnail"),
    props: z.object({
      id: z.optional(z.number().int().min(0)),
      description: z.optional(z.string().min(1).max(1024)),
      spoiler: z.optional(z.boolean()),
      media: z.object({
        url: z.string().max(2048),
      }),
    }),
    children: z.null(),
  })
  .transform(
    (obj): APIThumbnailComponent =>
      removeUndefined({
        type: ComponentType.Thumbnail as const,
        id: obj.props.id,
        description: obj.props.description ?? null,
        spoiler: obj.props.spoiler,
        media: obj.props.media,
      }),
  );
