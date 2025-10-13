import type { UndefinedOnPartialDeep } from "type-fest";
import * as z from "zod";
import type { MediaGalleryComponentForMessageRequest } from "../api/models";
import { MediaGalleryComponentForMessageRequestType } from "../api/models";

const mediaGalleryItemSchema = z.object({
  description: z.optional(z.string().min(1).max(1024)),
  spoiler: z.optional(z.boolean()),
  media: z.object({
    url: z.string().max(2048),
  }),
});

export const mediaGalleryElementSchema = z
  .object({
    name: z.literal("mediaGallery"),
    id: z.optional(z.number().int().min(0)),
    items: z.array(mediaGalleryItemSchema).min(1).max(10),
  })
  .transform(
    (obj): UndefinedOnPartialDeep<MediaGalleryComponentForMessageRequest> => ({
      type: MediaGalleryComponentForMessageRequestType.NUMBER_12,
      id: obj.id,
      items: obj.items,
    }),
  );

export type MediaGalleryElement = z.input<typeof mediaGalleryElementSchema>;
