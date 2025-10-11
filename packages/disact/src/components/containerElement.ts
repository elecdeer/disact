import * as z from "zod";
import { ContainerComponentForMessageRequestType } from "../api/models";
import { actionRowElementSchema } from "./actionRowElement";
import { fileElementSchema } from "./fileElement";
import { mediaGalleryElementSchema } from "./mediaGalleryElement";
import { sectionElementSchema } from "./sectionElement";
import { separatorElementSchema } from "./separatorElement";
import { textDisplayElementSchema } from "./textDisplayElement";

const containerComponentsSchema = z.discriminatedUnion("name", [
  actionRowElementSchema,
  fileElementSchema,
  mediaGalleryElementSchema,
  sectionElementSchema,
  separatorElementSchema,
  textDisplayElementSchema,
]);

export const containerElementSchema = z
  .object({
    name: z.literal("container"),
    id: z.optional(z.number().int().min(0)),
    accentColor: z.optional(z.number().int().min(0).max(0xffffff)),
    children: z.array(containerComponentsSchema).min(1).max(40),
    spoiler: z.optional(z.boolean()),
  })
  .transform((obj) => ({
    type: ContainerComponentForMessageRequestType.NUMBER_17,
    id: obj.id,
    accent_color: obj.accentColor,
    components: obj.children,
    spoiler: obj.spoiler,
  }));

export type ContainerElement = z.input<typeof containerElementSchema>;
