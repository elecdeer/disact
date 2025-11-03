import type { DisactNode } from "@disact/engine";
import {
  type APITextDisplayComponent,
  ComponentType,
} from "discord-api-types/v10";
import * as z from "zod";
import { removeUndefined } from "../utils/removeUndefined";

export type TextDisplayElement = {
  id?: number;
  children: DisactNode;
};

export const textDisplayElementSchema = z
  .object({
    type: z.literal("intrinsic"),
    name: z.literal("textDisplay"),
    props: z.object({
      id: z.optional(z.number().int().min(0)),
    }),
    children: z
      .array(
        z.object({
          type: z.literal("text"),
          content: z.string(),
        }),
      )
      .transform((arr) => arr.map((v) => v.content).join(""))
      .pipe(z.string().min(1).max(4000)),
  })
  .transform(
    (obj): APITextDisplayComponent =>
      removeUndefined({
        type: ComponentType.TextDisplay as const,
        id: obj.props.id,
        content: obj.children,
      }),
  );
