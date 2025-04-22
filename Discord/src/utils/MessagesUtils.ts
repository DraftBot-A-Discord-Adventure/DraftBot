import { DraftbotInteraction } from "../messages/DraftbotInteraction";
import { DiscordCache } from "../bot/DiscordCache";
import { PacketContext } from "../../../Lib/src/packets/DraftBotPacket";

export abstract class MessagesUtils {
	/**
	 * Get the current interaction from the context and cast it to DraftbotInteraction.
	 * It selects either the string select menu interaction, the button interaction or the interaction depending on which one is present in the context.
	 * The order of priority is string select menu interaction > button interaction > interaction.
	 * The interaction is retrieved from the DiscordCache.
	 * @param context
	 */
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
