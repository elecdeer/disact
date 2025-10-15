import type { DisactNode } from "@disact/engine";
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

export type ActionRowElement = {
  id?: number;
  children: DisactNode;
};

export const actionRowElementSchema = z
  .object({
    type: z.literal("intrinsic"),
    name: z.literal("actionRow"),
    props: z.object({
      id: z.optional(z.number().int().min(0)),
    }),
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
      id: obj.props.id,
      components: obj.children,
    }),
  );
