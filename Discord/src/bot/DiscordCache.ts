import {DraftbotInteraction} from "../messages/DraftbotInteraction";
import {Constants} from "../../../Lib/src/constants/Constants";

export class DiscordCache {
	private static initialized = false;

	private static interactionsCache: Map<string, { interaction: DraftbotInteraction, time: number }> = new Map();

	private static init(): void {
		if (!DiscordCache.initialized) {
			setInterval(DiscordCache.purge, 60000);
			DiscordCache.initialized = true;
		}
	}

	private static purge(): void {
		const now = Date.now();
		DiscordCache.interactionsCache.forEach((interactionEntry) => {
			if (interactionEntry.time < now) {
				DiscordCache.interactionsCache.delete(interactionEntry.interaction.id);
			}
		});
	}

	public static cacheInteraction(interaction: DraftbotInteraction): void {
		DiscordCache.init();
		DiscordCache.interactionsCache.set(interaction.id, { interaction, time: Date.now() + Constants.CACHE_TIME.INTERACTIONS });
	}

	public static getInteraction(id: string): DraftbotInteraction | null {
		const entry = DiscordCache.interactionsCache.get(id);
		return entry?.interaction ?? null;
	}
}