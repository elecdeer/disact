import {
  type APITextDisplayComponent,
  ComponentType,
} from "discord-api-types/v10";
import * as z from "zod";
import type { DisactNode } from "../types.js";
import { removeUndefined } from "../utils/removeUndefined.js";

export type TextDisplayProps = {
  id?: number;
  children: DisactNode;
};

/**
 * TextDisplay Core Component
 *
 * @see https://discord.com/developers/docs/components/reference#text-display
 */
export const TextDisplay = ({ children, ...props }: TextDisplayProps) => {
  return <textDisplay {...props}>{children}</textDisplay>;
};

export const textDisplayElementSchema = z
  .object({
    type: z.literal("textDisplay"),
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
