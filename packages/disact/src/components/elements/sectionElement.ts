import type { DisactNode } from "@disact/engine";
import { type APISectionComponent, ComponentType } from "discord-api-types/v10";
import * as z from "zod";
import { removeUndefined } from "../../utils/removeUndefined";
import { buttonElementSchema } from "./buttonElement";
import { createSlotSchema } from "./slotElement";
import { textDisplayElementSchema } from "./textDisplayElement";
import { thumbnailElementSchema } from "./thumbnailElement";

export type SectionElement = {
  id?: number;
  accessory: DisactNode;
  children: DisactNode;
};

const sectionComponentSchema = z.discriminatedUnion("name", [textDisplayElementSchema]);

const sectionAccessorySchema = z.discriminatedUnion("name", [
  buttonElementSchema,
  thumbnailElementSchema,
]);

// accessoryはslotで包まれている
const sectionAccessorySlotSchema = createSlotSchema(sectionAccessorySchema);

export const sectionElementSchema = z
  .object({
    type: z.literal("intrinsic"),
    name: z.literal("section"),
    props: z.object({
      id: z.optional(z.number().int().min(0)),
      accessory: sectionAccessorySlotSchema,
    }),
    children: z.array(sectionComponentSchema).min(1).max(3),
  })
  .transform(
    (obj): APISectionComponent =>
      removeUndefined({
        type: ComponentType.Section as const,
        id: obj.props.id,
        components: obj.children,
        accessory: obj.props.accessory,
      }),
  );
