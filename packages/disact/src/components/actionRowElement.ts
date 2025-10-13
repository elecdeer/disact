import type { UndefinedOnPartialDeep } from "type-fest";
import * as z from "zod";
import type { ActionRowComponentForMessageRequest } from "../api/models";
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
    id: z.optional(z.number().int().min(0)),
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
  .transform(
    (obj): UndefinedOnPartialDeep<ActionRowComponentForMessageRequest> => ({
      type: ActionRowComponentForMessageRequestType.NUMBER_1,
      id: obj.id,
      components: obj.children,
    }),
  );

export type ActionRowElement = z.input<typeof actionRowElementSchema>;
