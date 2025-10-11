import * as z from "zod";
import { ActionRowComponentForMessageRequestType } from "../api/models";
import { buttonElementSchema } from "./buttonElement";
import { channelSelectElementSchema } from "./channelSelectElement";
import { mentionableSelectElementSchema } from "./mentionableSelectElement";
import { roleSelectElementSchema } from "./roleSelectElement";
import { stringSelectElementSchema } from "./stringSelectElement";
import { userSelectElementSchema } from "./userSelectElement";

export const actionRowElementSchema = z
  .object({
    name: z.literal("actionRow"),
    id: z.number().int(),
    children: z
      .array(
        z.discriminatedUnion("name", [
          buttonElementSchema,
          stringSelectElementSchema,
          userSelectElementSchema,
          roleSelectElementSchema,
          mentionableSelectElementSchema,
          channelSelectElementSchema,
        ]),
      )
      .min(1)
      .max(5),
  })
  .transform((obj) => ({
    type: ActionRowComponentForMessageRequestType.NUMBER_1,
    id: obj.id,
    components: obj.children,
  }));

export type ActionRowElement = z.input<typeof actionRowElementSchema>;
