import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import Player from "../database/game/models/Player";
import {DraftbotInteraction} from "../messages/DraftbotInteraction";

/**
 * Interface representing the strict minimum a small event needs
 */
export interface SmallEvent {
	/**
	 * The command representing the small event
	 * @param interaction
	 * @param language
	 * @param player
	 * @param seEmbed
	 */
	executeSmallEvent: (interaction: DraftbotInteraction, language: string, player: Player, seEmbed: DraftBotEmbed) => Promise<void>;

	/**
	 * Says by whom the small event can be obtained
	 * @param player
	 */
	canBeExecuted: (player: Player) => Promise<boolean>;
}