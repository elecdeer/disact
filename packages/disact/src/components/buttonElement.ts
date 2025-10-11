import * as z from "zod";
import { ButtonComponentForMessageRequestType } from "../api/models";

export const buttonElementSchema = z
  .object({
    name: z.literal("button"),
    id: z.optional(z.number().int()),
    style: z.enum([
      "primary",
      "secondary",
      "success",
      "danger",
      "link",
      "purchase",
    ]),
    children: z.optional(z.string().max(80)),
    customId: z.optional(z.string().max(100)),
    disabled: z.optional(z.boolean().default(false)),
  })
  .transform((obj) => ({
    type: ButtonComponentForMessageRequestType.NUMBER_2,
    id: obj.id,
    style: {
      primary: 1,
      secondary: 2,
      success: 3,
      danger: 4,
      link: 5,
      purchase: 6,
    }[obj.style],
    label: obj.children,
    custom_id: obj.customId,
    disabled: obj.disabled,
  }));

export type ButtonElement = z.input<typeof buttonElementSchema>;
