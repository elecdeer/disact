import type { UndefinedOnPartialDeep } from "type-fest";
import * as z from "zod";
import {
  type SectionComponentForMessageRequest,
  SectionComponentForMessageRequestType,
} from "../api/models";
import { buttonElementSchema } from "./buttonElement";
import { textDisplayElementSchema } from "./textDisplayElement";
import { thumbnailElementSchema } from "./thumbnailElement";

const sectionComponentSchema = z.discriminatedUnion("name", [
  textDisplayElementSchema,
]);

const sectionAccessorySchema = z.discriminatedUnion("name", [
  buttonElementSchema,
  thumbnailElementSchema,
]);

export const sectionElementSchema = z
  .object({
    type: z.literal("intrinsic"),
    name: z.literal("section"),
    props: z.object({
      id: z.optional(z.number().int().min(0)),
      accessory: sectionAccessorySchema,
    }),
    children: z.array(sectionComponentSchema).min(1).max(3),
  })
  .transform(
    (obj): UndefinedOnPartialDeep<SectionComponentForMessageRequest> => ({
      type: SectionComponentForMessageRequestType.NUMBER_9,
      id: obj.props.id,
      components: obj.children,
      accessory: obj.props.accessory,
    }),
  );

export type SectionElement = z.input<typeof sectionElementSchema>;
