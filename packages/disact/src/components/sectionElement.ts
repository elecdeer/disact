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
    name: z.literal("section"),
    id: z.optional(z.number().int().min(0)),
    children: z.array(sectionComponentSchema).min(1).max(3),
    accessory: sectionAccessorySchema,
  })
  .transform(
    (obj): UndefinedOnPartialDeep<SectionComponentForMessageRequest> => ({
      type: SectionComponentForMessageRequestType.NUMBER_9,
      id: obj.id,
      components: obj.children,
      accessory: obj.accessory,
    }),
  );

export type SectionElement = z.input<typeof sectionElementSchema>;
