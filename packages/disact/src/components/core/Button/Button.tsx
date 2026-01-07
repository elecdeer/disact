import type { APIMessageComponentInteraction } from "discord-api-types/v10";
import { ComponentType, InteractionType } from "discord-api-types/v10";
import type { DisactNode, FC } from "../../..";
import { useInteraction } from "../../../hooks";

export type ButtonProps = {
  id?: number;
  children?: DisactNode;
  disabled?: boolean;
} & (
  | {
      style: "primary" | "secondary" | "success" | "danger";
      customId: string;
      onClick?: (interaction: APIMessageComponentInteraction) => void | Promise<void>;
    }
  | { style: "link"; url: string; customId?: undefined; onClick?: undefined }
  | { style: "premium"; skuId: string; customId?: undefined; onClick?: undefined }
);

/**
 * Button - クリック可能なボタンコンポーネント
 *
 * @example
 * ```tsx
 * <Button customId="my-button" style="primary" onClick={(interaction) => {
 *   console.log('Button clicked!', interaction.data.custom_id);
 * }}>
 *   Click me
 * </Button>
 * ```
 */
export const Button: FC<ButtonProps> = ({ children, onClick, customId, ...rest }) => {
  useInteraction<APIMessageComponentInteraction>((interaction) => {
    // このボタンがクリックされた場合のみ実行
    if (
      interaction.type === InteractionType.MessageComponent &&
      interaction.data.component_type === ComponentType.Button &&
      interaction.data.custom_id === customId
    ) {
      return;
    }

    return onClick?.(interaction);
  });

  return (
    <message-component type={ComponentType.Button} customId={customId} {...rest}>
      {children ? <slot name="children">{children}</slot> : null}
    </message-component>
  );
};
