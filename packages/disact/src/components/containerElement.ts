import type { DisactNode } from "@disact/engine";
import {
  type APIContainerComponent,
  ComponentType,
} from "discord-api-types/v10";
import * as z from "zod";
import { removeUndefined } from "../utils/removeUndefined";
import { actionRowInMessageElementSchema } from "./actionRowElement";
import { fileElementSchema } from "./fileElement";
import { mediaGalleryElementSchema } from "./mediaGalleryElement";
import { sectionElementSchema } from "./sectionElement";
import { separatorElementSchema } from "./separatorElement";
import { textDisplayElementSchema } from "./textDisplayElement";

export type ContainerElement = {
  id?: number;
  accentColor?: number;
  spoiler?: boolean;
  children: DisactNode;
};

const containerComponentsSchema = z.discriminatedUnion("name", [
  actionRowInMessageElementSchema,
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
    (obj): APIContainerComponent =>
      removeUndefined({
        type: ComponentType.Container as const,
        id: obj.props.id,
        accent_color: obj.props.accentColor,
        components: obj.children,
        spoiler: obj.props.spoiler,
      }),
  );
