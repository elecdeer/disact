import type { UndefinedOnPartialDeep } from "type-fest";
import * as z from "zod";
import {
  type ThumbnailComponentForMessageRequest,
  ThumbnailComponentForMessageRequestType,
} from "../api/models";

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
    (obj): UndefinedOnPartialDeep<ThumbnailComponentForMessageRequest> => ({
      type: ThumbnailComponentForMessageRequestType.NUMBER_11,
      id: obj.props.id,
      description: obj.props.description,
      spoiler: obj.props.spoiler,
      media: obj.props.media,
    }),
  );
