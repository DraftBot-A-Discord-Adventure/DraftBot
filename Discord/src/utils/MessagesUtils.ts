import {DraftbotInteraction} from "../messages/DraftbotInteraction";
import {DiscordCache} from "../bot/DiscordCache";
import {PacketContext} from "../../../Lib/src/packets/DraftBotPacket";

export abstract class MessagesUtils {
	static getCurrentInteraction(context: PacketContext): DraftbotInteraction {
		if (context.discord!.stringSelectMenuInteraction) {
			const stringSelectMenuInteraction = DiscordCache.getStringSelectMenuInteraction(context.discord!.stringSelectMenuInteraction);
			if (stringSelectMenuInteraction) {
				return DraftbotInteraction.cast(stringSelectMenuInteraction);
			}
		}

		if (context.discord!.buttonInteraction) {
			const buttonInteraction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction);
			if (buttonInteraction) {
				return DraftbotInteraction.cast(buttonInteraction);
			}
		}

		return DiscordCache.getInteraction(context.discord!.interaction)!;
	}
}