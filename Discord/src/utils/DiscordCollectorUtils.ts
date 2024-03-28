import {makePacket, PacketContext} from "../../../Lib/src/packets/DraftBotPacket";
import {
	ReactionCollectorCreationPacket,
	ReactionCollectorReactPacket
} from "../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {DiscordCache} from "../bot/DiscordCache";
import {DiscordWebSocket} from "../bot/Websocket";
import {KeycloakUser} from "../../../Lib/src/keycloak/KeycloakUser";
import {ButtonInteraction} from "discord.js";

export class DiscordCollectorUtils {
	static sendReaction(packet: ReactionCollectorCreationPacket, context: PacketContext, user: KeycloakUser, button: ButtonInteraction | null, reactionIndex: number): void {
		const responsePacket = makePacket(
			ReactionCollectorReactPacket,
			{
				id: packet.id,
				keycloakId: user.id,
				reactionIndex: reactionIndex
			}
		);

		if (button) {
			DiscordCache.cacheButtonInteraction(button);
		}
		DiscordWebSocket.socket!.send(JSON.stringify({
			packet: {
				name: responsePacket.constructor.name,
				data: responsePacket
			},
			context: {
				keycloakId: user.id,
				discord: {
					user: context.discord!.user,
					channel: context.discord!.channel,
					interaction: context.discord!.interaction,
					buttonInteraction: button?.id,
					language: context.discord!.language
				}
			}
		}));
	}
}