import type { RenderedElement } from "@disact/engine";
import * as z from "zod";
import {
  type ActionRowElement,
  actionRowElementSchema,
} from "./actionRowElement";
import { type ButtonElement, buttonElementSchema } from "./buttonElement";
import {
  type ChannelSelectElement,
  channelSelectElementSchema,
} from "./channelSelectElement";
import {
  type ContainerElement,
  containerElementSchema,
} from "./containerElement";
import { type FileElement, fileElementSchema } from "./fileElement";
import {
  type MediaGalleryElement,
  mediaGalleryElementSchema,
} from "./mediaGalleryElement";
import {
  type MentionableSelectElement,
  mentionableSelectElementSchema,
} from "./mentionableSelectElement";
import {
  type RoleSelectElement,
  roleSelectElementSchema,
} from "./roleSelectElement";
import { type SectionElement, sectionElementSchema } from "./sectionElement";
import {
  type SeparatorElement,
  separatorElementSchema,
} from "./separatorElement";
import {
  type StringSelectElement,
  stringSelectElementSchema,
} from "./stringSelectElement";
import {
  type TextDisplayElement,
  textDisplayElementSchema,
} from "./textDisplayElement";
import {
  type ThumbnailElement,
  thumbnailElementSchema,
} from "./thumbnailElement";
import {
  type UserSelectElement,
  userSelectElementSchema,
} from "./userSelectElement";

export type IntrinsicElements = {
  actionRow: ActionRowElement;
  button: ButtonElement;
  stringSelect: StringSelectElement;
  userSelect: UserSelectElement;
  roleSelect: RoleSelectElement;
  mentionableSelect: MentionableSelectElement;
  channelSelect: ChannelSelectElement;
  textDisplay: TextDisplayElement;
  separator: SeparatorElement;
  file: FileElement;
  mediaGallery: MediaGalleryElement;
  thumbnail: ThumbnailElement;
  section: SectionElement;
  container: ContainerElement;
};

export type PayloadElement = z.infer<typeof rootElementSchema>;

export const toPayload = (element: RenderedElement): PayloadElement => {
  if (element.type === "intrinsic") {
    return rootElementSchema.parse(element);
  }

  throw new Error(
    `Invalid root element type: ${element.type}. Only intrinsic elements are allowed at root level.`,
  );
};

const rootElementSchema = z.discriminatedUnion("name", [
  actionRowElementSchema,
  buttonElementSchema,
  channelSelectElementSchema,
  containerElementSchema,
  fileElementSchema,
  mediaGalleryElementSchema,
  mentionableSelectElementSchema,
  roleSelectElementSchema,
  sectionElementSchema,
  separatorElementSchema,
  stringSelectElementSchema,
  textDisplayElementSchema,
  thumbnailElementSchema,
  userSelectElementSchema,
]);
