import { type APIContainerComponent, ComponentType } from "discord-api-types/v10";
import * as z from "zod";
import { removeUndefined } from "../../../utils/removeUndefined";
import { actionRowInMessageElementSchema } from "../ActionRow/actionRowSchema";
import { fileElementSchema } from "../File/fileSchema";
import { mediaGalleryElementSchema } from "../MediaGallery/mediaGallerySchema";
import { createNamedSlotSchema } from "../../elements/schemaUtils";
import { sectionElementSchema } from "../Section/sectionSchema";
import { separatorElementSchema } from "../Separator/separatorSchema";
import { textDisplayElementSchema } from "../TextDisplay/textDisplaySchema";

const containerComponentsSchema = z.union([
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
    name: z.literal("message-component"),
    props: z.object({
      type: z.literal(ComponentType.Container),
      id: z.optional(z.number().int().min(0)),
      accentColor: z.optional(z.number().int().min(0).max(0xffffff)),
      spoiler: z.optional(z.boolean()),
    }),
    children: z
      .array(createNamedSlotSchema("components", containerComponentsSchema, { min: 1, max: 40 }))
      .length(1),
  })
  .transform((obj): APIContainerComponent => {
    const components = obj.children[0]!.children;
    return removeUndefined({
      type: ComponentType.Container as const,
      id: obj.props.id,
      accent_color: obj.props.accentColor,
      components,
      spoiler: obj.props.spoiler,
    });
  });
