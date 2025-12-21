import type { DisactNode, RenderedElement } from "@disact/engine";
import type { APIMessageTopLevelComponent } from "discord-api-types/v10";
import type { ActionRowElement } from "./elements/actionRowElement";
import type { ButtonElement } from "./elements/buttonElement";
import type { ChannelSelectElement } from "./elements/channelSelectElement";
import type { ContainerElement } from "./elements/containerElement";
import type { FileElement } from "./elements/fileElement";
import type { MediaGalleryElement } from "./elements/mediaGalleryElement";
import type { MentionableSelectElement } from "./elements/mentionableSelectElement";
import {
  type MessageComponentsRootElement,
  messageComponentsRootElementSchema,
} from "./elements/messageComponentRoot";
import type { RoleSelectElement } from "./elements/roleSelectElement";
import type { SectionElement } from "./elements/sectionElement";
import type { SeparatorElement } from "./elements/separatorElement";
import type { StringSelectElement } from "./elements/stringSelectElement";
import type { TextDisplayElement } from "./elements/textDisplayElement";
import type { ThumbnailElement } from "./elements/thumbnailElement";
import type { UserSelectElement } from "./elements/userSelectElement";

export type IntrinsicElements = {
  slot: { children?: DisactNode };

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
