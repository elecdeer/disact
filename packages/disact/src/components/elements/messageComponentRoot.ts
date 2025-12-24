import * as z from "zod";
import { actionRowInMessageElementSchema } from "./actionRowElement";
import { containerElementSchema } from "./containerElement";
import { fileElementSchema } from "./fileElement";
import { mediaGalleryElementSchema } from "./mediaGalleryElement";
import { sectionElementSchema } from "./sectionElement";
import { separatorElementSchema } from "./separatorElement";
import { textDisplayElementSchema } from "./textDisplayElement";

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
