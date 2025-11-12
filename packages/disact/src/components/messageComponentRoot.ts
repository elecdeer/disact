import type { DisactNode } from "@disact/engine";
import * as z from "zod";
import { actionRowInMessageElementSchema } from "./ActionRow";
import { containerElementSchema } from "./containerElement";
import { fileElementSchema } from "./fileElement";
import { mediaGalleryElementSchema } from "./mediaGalleryElement";
import { sectionElementSchema } from "./Section";
import { separatorElementSchema } from "./Separator";
import { textDisplayElementSchema } from "./TextDisplay";

export type MessageComponentsRootElement = {
  children: DisactNode;
};

export const messageComponentsRootElementSchema = z.object({
  children: z
    .array(
      z.discriminatedUnion("name", [
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
