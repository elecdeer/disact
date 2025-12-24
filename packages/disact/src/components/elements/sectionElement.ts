import type { DisactNode } from "@disact/engine";
import { type APISectionComponent, ComponentType } from "discord-api-types/v10";
import * as z from "zod";
import { removeUndefined } from "../../utils/removeUndefined";
import { buttonElementSchema } from "./buttonElement";
import { textDisplayElementSchema } from "./textDisplayElement";
import { thumbnailElementSchema } from "./thumbnailElement";

export type SectionElement = {
  id?: number;
  accessory: DisactNode;
  children: DisactNode;
};

const sectionComponentSchema = z.union([textDisplayElementSchema]);

const sectionAccessorySchema = z.union([buttonElementSchema, thumbnailElementSchema]);

export const sectionElementSchema = z
  .object({
    type: z.literal("intrinsic"),
    name: z.literal("message-component"),
    props: z.object({
      type: z.literal(ComponentType.Section),
      id: z.optional(z.number().int().min(0)),
    }),
    children: z.array(
      z.union([
        z.object({
          type: z.literal("intrinsic"),
          name: z.literal("slot"),
          props: z.object({ name: z.literal("components") }),
          children: z.array(sectionComponentSchema).min(1).max(3),
        }),
        z.object({
          type: z.literal("intrinsic"),
          name: z.literal("slot"),
          props: z.object({ name: z.literal("accessory") }),
          children: z.array(sectionAccessorySchema).length(1),
        }),
      ]),
    ),
  })
  .transform((obj): APISectionComponent => {
    const componentsSlot = obj.children.find(
      (child) => child.name === "slot" && child.props.name === "components",
    );
    const accessorySlot = obj.children.find(
      (child) => child.name === "slot" && child.props.name === "accessory",
    );

    if (!componentsSlot) {
      throw new Error("Required slot 'components' not found");
    }

    // z.unionの結果として型推論が複雑になるため、明示的に型を指定
    const base = {
      type: ComponentType.Section as const,
      components: componentsSlot.children as APISectionComponent["components"],
      accessory: accessorySlot?.children[0] as APISectionComponent["accessory"],
    };

    return removeUndefined(
      obj.props.id !== undefined ? { ...base, id: obj.props.id } : base,
    ) as APISectionComponent;
  });
