import {
  type APIContainerComponent,
  ComponentType,
} from "discord-api-types/v10";
import * as z from "zod";
import type { DisactNode } from "../types.js";
import { removeUndefined } from "../utils/removeUndefined.js";
import { fileElementSchema } from "./File.js";
import { mediaGalleryElementSchema } from "./MediaGallery.js";
import { sectionElementSchema } from "./Section.js";
import { separatorElementSchema } from "./Separator.js";
import { textDisplayElementSchema } from "./TextDisplay.js";

export type ContainerProps = {
  id?: number;
  accentColor?: number;
  spoiler?: boolean;
  children: DisactNode;
};

/**
 * Container Core Component
 *
 * @see https://discord.com/developers/docs/components/reference#container
 */
export const Container = ({ children, ...props }: ContainerProps) => {
  return <container {...props}>{children}</container>;
};

const containerComponentsSchema = z.discriminatedUnion("name", [
  fileElementSchema,
  mediaGalleryElementSchema,
  sectionElementSchema,
  separatorElementSchema,
  textDisplayElementSchema,
]);

export const containerElementSchema = z
  .object({
    type: z.literal("container"),

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
