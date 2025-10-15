import type { UndefinedOnPartialDeep } from "type-fest";
import * as z from "zod";
import type { ContainerComponentForMessageRequest } from "../api/models";
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
    type: z.literal("intrinsic"),
    name: z.literal("container"),
    props: z.object({
      id: z.optional(z.number().int().min(0)),
      accentColor: z.optional(z.number().int().min(0).max(0xffffff)),
      spoiler: z.optional(z.boolean()),
    }),
    children: z.array(containerComponentsSchema).min(1).max(40),
  })
  .transform(
    (obj): UndefinedOnPartialDeep<ContainerComponentForMessageRequest> => ({
      type: ContainerComponentForMessageRequestType.NUMBER_17,
      id: obj.props.id,
      accent_color: obj.props.accentColor,
      components: obj.children,
      spoiler: obj.props.spoiler,
    }),
  );

export type ContainerElement = z.input<typeof containerElementSchema>;
