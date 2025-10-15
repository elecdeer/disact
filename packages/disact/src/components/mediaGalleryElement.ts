import type { UndefinedOnPartialDeep } from "type-fest";
import * as z from "zod";
import type { MediaGalleryComponentForMessageRequest } from "../api/models";
import { MediaGalleryComponentForMessageRequestType } from "../api/models";

export type MediaGalleryElement = {
  id?: number;
  items: Array<{
    description?: string;
    spoiler?: boolean;
    media: {
      url: string;
    };
  }>;
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
    type: z.literal("intrinsic"),
    name: z.literal("mediaGallery"),
    props: z.object({
      id: z.optional(z.number().int().min(0)),
      items: z.array(mediaGalleryItemSchema).min(1).max(10),
    }),
    children: z.null(),
  })
  .transform(
    (obj): UndefinedOnPartialDeep<MediaGalleryComponentForMessageRequest> => ({
      type: MediaGalleryComponentForMessageRequestType.NUMBER_12,
      id: obj.props.id,
      items: obj.props.items,
    }),
  );
