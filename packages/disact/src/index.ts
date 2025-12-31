import type { DisactNode, PropsBase } from "@disact/engine";

export type {
  DisactElement,
  DisactNode,
  FunctionComponent,
  IntrinsicElementName,
  PropsBase,
} from "@disact/engine";

export { ErrorBoundary, Suspense } from "@disact/engine";

// Core Components
export { ActionRow, type ActionRowProps } from "./components/core/ActionRow/ActionRow";
export { Button, type ButtonProps } from "./components/core/Button/Button";
export {
  ChannelSelect,
  type ChannelSelectProps,
} from "./components/core/ChannelSelect/ChannelSelect";
export { Components, type ComponentsProps } from "./components/core/Components/Components";
export { Container, type ContainerProps } from "./components/core/Container/Container";
export { File, type FileProps } from "./components/core/File/File";
export { MediaGallery, type MediaGalleryProps } from "./components/core/MediaGallery/MediaGallery";
export {
  MentionableSelect,
  type MentionableSelectProps,
} from "./components/core/MentionableSelect/MentionableSelect";
export { RoleSelect, type RoleSelectProps } from "./components/core/RoleSelect/RoleSelect";
export { Section, type SectionProps } from "./components/core/Section/Section";
export { Separator, type SeparatorProps } from "./components/core/Separator/Separator";
export { StringSelect, type StringSelectProps } from "./components/core/StringSelect/StringSelect";
export { TextDisplay, type TextDisplayProps } from "./components/core/TextDisplay/TextDisplay";
export { Thumbnail, type ThumbnailProps } from "./components/core/Thumbnail/Thumbnail";
export { UserSelect, type UserSelectProps } from "./components/core/UserSelect/UserSelect";

// TODO: 場所は要検討
export type FC<P extends PropsBase = {}> = (props: P) => DisactNode;

export type {
  ApplicationCommandInteraction,
  CreateSessionFromInteractionOptions,
} from "./app/createSessionFromInteraction";
export { createSessionFromApplicationCommandInteraction } from "./app/createSessionFromInteraction";
// DisactApp
export type { DisactApp } from "./app/disactApp";
export { createDisactApp } from "./app/disactApp";
export type { Session } from "./app/session";

// Hooks
export { useInteraction } from "./hooks";
export type { InteractionCallback, InteractionCallbacksContext } from "./hooks";
