import type { IncomingWebhookUpdateForInteractionCallbackRequestPartial } from "../api/models/incomingWebhookUpdateForInteractionCallbackRequestPartial";
import type { Session } from "./session";
import {
	createInteractionResponse,
	getOriginalWebhookMessage,
	updateOriginalWebhookMessage,
} from "../api/discord-api";
import type { PayloadElement } from "../components/index.ts";

/**
 * Application Command Interactionオブジェクトの最小型定義
 * Discord APIから渡されるinteractionオブジェクトの構造
 */
export type ApplicationCommandInteraction = {
	/** Interaction ID */
	id: string;
	/** Application ID */
	application_id: string;
	/** Interaction Type (2 for Application Command) */
	type: 2;
	/** Interaction token - valid for 15 minutes */
	token: string;
	/** Command data */
	data?: unknown;
	/** Guild ID (if invoked in a guild) */
	guild_id?: string;
	/** Channel ID where invoked */
	channel_id?: string;
	/** User who invoked (in DMs) or member who invoked (in guilds) */
	member?: unknown;
	user?: unknown;
};

/**
 * Application Command InteractionからSessionを作成する際のオプション
 */
export type CreateSessionFromInteractionOptions = {
	/** レスポンスをephemeralにするか (デフォルト: false) */
	ephemeral?: boolean;
	/** API base URL (デフォルト: "https://discord.com/api/v10") */
	baseUrl?: string;
	/** getOriginalを毎回fetchするか、キャッシュを返すか (デフォルト: false) */
	alwaysFetch?: boolean;
};

/**
 * Application Command InteractionからSessionを作成する
 *
 * @param interaction - Discord APIから受け取ったApplication Command Interaction
 * @param options - Session作成オプション
 * @returns Session オブジェクト
 *
 * @example
 * ```typescript
 * const session = createSessionFromApplicationCommandInteraction(interaction, {
 *   ephemeral: false,
 *   alwaysFetch: false,
 * });
 *
 * await session.commit(payload);
 * const current = await session.getCurrent();
 * ```
 */
export const createSessionFromApplicationCommandInteraction = (
	interaction: ApplicationCommandInteraction,
	options?: CreateSessionFromInteractionOptions,
): Session => {
	const ephemeral = options?.ephemeral ?? false;
	const baseUrl = options?.baseUrl ?? "https://discord.com/api/v10";
	const alwaysFetch = options?.alwaysFetch ?? false;

	let hasCommitted = false;
	let cachedPayload: PayloadElement | null = null;

	return {
		commit: async (payload: PayloadElement): Promise<void> => {
			if (!hasCommitted) {
				// 初回: POST /interactions/{interaction.id}/{interaction.token}/callback
				await createInteractionResponse(
					interaction.id,
					interaction.token,
					{
						type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
						data: {
							...(payload as any),
							...(ephemeral ? { flags: 64 } : {}),
						},
					},
					undefined,
					{
						headers: {
							"Content-Type": "application/json",
						},
					},
				);
				hasCommitted = true;
				cachedPayload = payload;
			} else {
				// 2回目以降: PATCH /webhooks/{application.id}/{interaction.token}/messages/@original
				await updateOriginalWebhookMessage(
					interaction.application_id,
					interaction.token,
					payload as unknown as IncomingWebhookUpdateForInteractionCallbackRequestPartial,
					undefined,
					{
						headers: {
							"Content-Type": "application/json",
						},
					},
				);
				cachedPayload = payload;
			}
		},

		getCurrent: async (): Promise<PayloadElement | null> => {
			if (!hasCommitted) {
				return null;
			}

			if (!alwaysFetch) {
				return cachedPayload;
			}

			// alwaysFetchがtrueの場合、APIから取得
			const response = await getOriginalWebhookMessage(
				interaction.application_id,
				interaction.token,
				undefined,
				{
					headers: {
						"Content-Type": "application/json",
					},
				},
			);

			if (response.status === 200 && response.data) {
				// MessageResponse.components を PayloadElement として返す
				const payload = response.data.components as unknown as PayloadElement;
				cachedPayload = payload;
				return payload;
			}

			return null;
		},
	};
};
