import type { RenderedElement } from "@disact/engine";
import type { APIMessageTopLevelComponent } from "discord-api-types/v10";
import type { ActionRowElement } from "./actionRowElement";
import type { ButtonElement } from "./buttonElement";
import type { ChannelSelectElement } from "./channelSelectElement";
import type { ContainerElement } from "./containerElement";
import type { FileElement } from "./fileElement";
import type { MediaGalleryElement } from "./mediaGalleryElement";
import type { MentionableSelectElement } from "./mentionableSelectElement";
import {
  type MessageComponentsRootElement,
  messageComponentsRootElementSchema,
} from "./messageComponentRoot";
import type { RoleSelectElement } from "./roleSelectElement";
import type { SectionElement } from "./sectionElement";
import type { SeparatorElement } from "./separatorElement";
import type { StringSelectElement } from "./stringSelectElement";
import type { TextDisplayElement } from "./textDisplayElement";
import type { ThumbnailElement } from "./thumbnailElement";
import type { UserSelectElement } from "./userSelectElement";

export type IntrinsicElements = {
  components: MessageComponentsRootElement;

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

export type PayloadElements = APIMessageTopLevelComponent[];

export const toMessageComponentsPayload = (element: RenderedElement): PayloadElements => {
  if (element.type === "intrinsic") {
    return messageComponentsRootElementSchema.parse(element).children;
  }

  throw new Error(
    `Invalid root element type: ${element.type}. Only intrinsic elements are allowed at root level.`,
  );
};
