import {
  type APIThumbnailComponent,
  ComponentType,
} from "discord-api-types/v10";
import * as z from "zod";
import { removeUndefined } from "../utils/removeUndefined.js";

export type ThumbnailProps = {
  id?: number;
  description?: string;
  spoiler?: boolean;
  media: {
    url: string;
  };
};

/**
 * Thumbnail Core Component
 *
 * @see https://discord.com/developers/docs/components/reference#thumbnail
 */
export const Thumbnail = (props: ThumbnailProps) => {
  return <thumbnail {...props} />;
};

export const thumbnailElementSchema = z
  .object({
    type: z.literal("thumbnail"),

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
