import * as z from "zod";
import { actionRowInMessageElementSchema } from "../core/ActionRow/actionRowSchema";
import { containerElementSchema } from "../core/Container/containerSchema";
import { fileElementSchema } from "../core/File/fileSchema";
import { mediaGalleryElementSchema } from "../core/MediaGallery/mediaGallerySchema";
import { sectionElementSchema } from "../core/Section/sectionSchema";
import { separatorElementSchema } from "../core/Separator/separatorSchema";
import { textDisplayElementSchema } from "../core/TextDisplay/textDisplaySchema";

export const messageComponentsRootElementSchema = z.object({
  children: z
    .array(
      z.union([
        actionRowInMessageElementSchema,
        containerElementSchema,
        fileElementSchema,
        mediaGalleryElementSchema,
        sectionElementSchema,
        separatorElementSchema,
        textDisplayElementSchema,
      ]),
    )
    .min(1)
    .max(40),
});
