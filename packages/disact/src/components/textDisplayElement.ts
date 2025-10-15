import type { DisactNode } from "@disact/engine";
import type { UndefinedOnPartialDeep } from "type-fest";
import * as z from "zod";
import {
  type TextDisplayComponentForMessageRequest,
  TextDisplayComponentForMessageRequestType,
} from "../api/models";

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
    (obj): UndefinedOnPartialDeep<TextDisplayComponentForMessageRequest> => ({
      type: TextDisplayComponentForMessageRequestType.NUMBER_10,
      id: obj.props.id,
      content: obj.children,
    }),
  );
