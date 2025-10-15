import type { DisactNode } from "@disact/engine";
import type { UndefinedOnPartialDeep } from "type-fest";
import * as z from "zod";
import {
  type ButtonComponentForMessageRequest,
  ButtonComponentForMessageRequestType,
} from "../api/models";

export type ButtonElement = {
  id?: number;
  style: "primary" | "secondary" | "success" | "danger" | "link" | "purchase";
  children?: DisactNode;
  customId?: string;
  disabled?: boolean;
};

export const buttonElementSchema = z
  .object({
    type: z.literal("intrinsic"),
    name: z.literal("button"),
    props: z.object({
      id: z.optional(z.number().int()),
      style: z.enum([
        "primary",
        "secondary",
        "success",
        "danger",
        "link",
        "purchase",
      ]),
      customId: z.optional(z.string().max(100)),
      disabled: z.optional(z.boolean().default(false)),
    }),
    children: z.optional(
      z
        .array(
          z.object({
            type: z.literal("text"),
            content: z.string(),
          }),
        )
        .transform((arr) => arr.map((v) => v.content).join(""))
        .pipe(z.string().max(80)),
    ),
  })
  .transform(
    (obj): UndefinedOnPartialDeep<ButtonComponentForMessageRequest> => ({
      type: ButtonComponentForMessageRequestType.NUMBER_2,
      id: obj.props.id,
      style: {
        primary: 1,
        secondary: 2,
        success: 3,
        danger: 4,
        link: 5,
        purchase: 6,
      }[obj.props.style],
      label: obj.children,
      custom_id: obj.props.customId,
      disabled: obj.props.disabled,
    }),
  );
