import type { UndefinedOnPartialDeep } from "type-fest";
import * as z from "zod";
import {
  type SeparatorComponentForMessageRequest,
  SeparatorComponentForMessageRequestType,
} from "../api/models";

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
    (obj): UndefinedOnPartialDeep<SeparatorComponentForMessageRequest> => ({
      type: SeparatorComponentForMessageRequestType.NUMBER_14,
      id: obj.props.id,
      spacing: obj.props.spacing,
      divider: obj.props.divider,
    }),
  );

export type SeparatorElement = z.input<typeof separatorElementSchema>;
