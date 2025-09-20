import type * as mdast from "mdast";
import type { IntrinsicsNode } from "./types";

//TODO: sanitizeが必要？
// idに `>hoge<@1111>` などが入っているとまずい

export const transformUserNode = (
  element: IntrinsicsNode<"user">,
): [mdast.Html] => {
  return [
    {
      type: "html",
      value: `<@${element.props.id}>`,
    } satisfies mdast.Html,
  ];
};

export const transformChannelNode = (
  element: IntrinsicsNode<"channel">,
): [mdast.Html] => {
  return [
    {
      type: "html",
      value: `<#${element.props.id}>`,
    } satisfies mdast.Html,
  ];
};

export const transformRoleNode = (
  element: IntrinsicsNode<"role">,
): [mdast.Html] => {
  return [
    {
      type: "html",
      value: `<@&${element.props.id}>`,
    } satisfies mdast.Html,
  ];
};

export const transformSlashCommandNode = (
  element: IntrinsicsNode<"slashCommand">,
): [mdast.Html] => {
  return [
    {
      type: "html",
      value: `</${element.props.name}:${element.props.id}>`,
    } satisfies mdast.Html,
  ];
};

export const transformGuildNavigationNode = (
  element: IntrinsicsNode<"guildNav">,
): [mdast.Html] => {
  return [
    {
      type: "html",
      value: `<id:${element.props.type}>`,
    } satisfies mdast.Html,
  ];
};
