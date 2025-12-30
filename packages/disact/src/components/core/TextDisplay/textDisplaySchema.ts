import { ComponentType } from "discord-api-types/v10";
import * as z from "zod";
import { removeUndefined } from "../../../utils/removeUndefined";
import { createSingleSlotComponentSchema, extractTextContent } from "../../elements/schemaUtils";

const textNodeSchema = z.object({
  type: z.literal("text"),
  content: z.string(),
});

export const textDisplayElementSchema = createSingleSlotComponentSchema(
  ComponentType.TextDisplay,
  z.object({
    id: z.optional(z.number().int().min(0)),
  }),
  "children",
  textNodeSchema,
  ({ props, slotContent }) => {
    const content = extractTextContent(slotContent);
    // Validate content length
    z.string().min(1).max(4000).parse(content);
    return removeUndefined({
      type: ComponentType.TextDisplay as const,
      id: props.id,
      content,
    });
  },
);
