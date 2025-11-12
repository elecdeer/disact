import { type APISectionComponent, ComponentType } from "discord-api-types/v10";
import * as z from "zod";
import type { DisactNode } from "../types.js";
import { removeUndefined } from "../utils/removeUndefined.js";
import { buttonElementSchema } from "./Button.js";
import { textDisplayElementSchema } from "./TextDisplay.js";
import { thumbnailElementSchema } from "./Thumbnail.js";

export type SectionProps = {
  id?: number;
  accessory?: DisactNode;
  children: DisactNode;
};

/**
 * Section Core Component
 *
 * @see https://discord.com/developers/docs/components/reference#section
 */
export const Section = ({ children, accessory, ...props }: SectionProps) => {
  return (
    <section {...props}>
      <slot name="components">{children}</slot>
      <slot name="accessory">{accessory}</slot>
    </section>
  );
};

const sectionComponentSchema = z.discriminatedUnion("name", [
  textDisplayElementSchema,
]);

const sectionAccessorySchema = z.discriminatedUnion("name", [
  buttonElementSchema,
  thumbnailElementSchema,
]);

export const sectionElementSchema = z
  .object({
    type: z.literal("section"),
    props: z.object({
      id: z.optional(z.number().int().min(0)),
      accessory: sectionAccessorySchema,
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
