import type { DisactNode, RenderedElement } from "@disact/engine";
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

type Simplify<T> = { [KeyType in keyof T]: T[KeyType] } & {};

type ElementProps<
  T,
  Override extends Partial<Record<keyof T, unknown>> = Record<never, never>,
> = Simplify<
  Omit<T, "name" | keyof Override> & {
    [key in keyof Override]: Override[key];
  }
>;

export type IntrinsicElements = {
  actionRow: ElementProps<ActionRowElement, { children: DisactNode }>;
  button: ElementProps<ButtonElement>;
  stringSelect: ElementProps<StringSelectElement>;
  userSelect: ElementProps<UserSelectElement>;
  roleSelect: ElementProps<RoleSelectElement>;
  mentionableSelect: ElementProps<MentionableSelectElement>;
  channelSelect: ElementProps<ChannelSelectElement>;
  textDisplay: ElementProps<TextDisplayElement>;
  separator: ElementProps<SeparatorElement>;
  file: ElementProps<FileElement>;
  mediaGallery: ElementProps<MediaGalleryElement>;
  thumbnail: ElementProps<ThumbnailElement>;
  section: ElementProps<
    SectionElement,
    { children: DisactNode; accessory: DisactNode }
  >;
  container: ElementProps<ContainerElement, { children: DisactNode }>;
};

type PayloadElement = object | string;

export const toPayload = (element: RenderedElement): PayloadElement => {
  if (element.type === "text") {
    return element.content;
  }

  if (element.type === "intrinsic") {
    return rootElementSchema.parse(element);
  }

  throw new Error(`Unknown rendered element type: ${JSON.stringify(element)}`);
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
