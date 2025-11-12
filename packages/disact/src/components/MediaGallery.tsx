import {
  type APIMediaGalleryComponent,
  ComponentType,
} from "discord-api-types/v10";
import * as z from "zod";
import { removeUndefined } from "../utils/removeUndefined.js";

export type MediaGalleryProps = {
  id?: number;
  items: Array<{
    description?: string;
    spoiler?: boolean;
    media: {
      url: string;
    };
  }>;
};

/**
 * MediaGallery Core Component
 *
 * @see https://discord.com/developers/docs/components/reference#media-gallery
 */
export const MediaGallery = (props: MediaGalleryProps) => {
  return <mediaGallery {...props} />;
};

const mediaGalleryItemSchema = z.object({
  description: z.optional(z.string().min(1).max(1024)),
  spoiler: z.optional(z.boolean()),
  media: z.object({
    url: z.string().max(2048),
  }),
});

export const mediaGalleryElementSchema = z
  .object({
    type: z.literal("mediaGallery"),

    props: z.object({
      id: z.optional(z.number().int().min(0)),
      items: z.array(mediaGalleryItemSchema).min(1).max(10),
    }),
    children: z.null(),
  })
  .transform(
    (obj): APIMediaGalleryComponent =>
      removeUndefined({
        type: ComponentType.MediaGallery as const,
        id: obj.props.id,
        items: obj.props.items.map((item) =>
          removeUndefined({
            media: item.media,
            description: item.description ?? null,
            spoiler: item.spoiler,
          }),
        ),
      }),
  );
