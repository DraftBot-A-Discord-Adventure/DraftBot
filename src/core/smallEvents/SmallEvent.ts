import {CommandInteraction} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import Player from "../database/game/models/Player";
import {Language} from "../constants/TypeConstants";

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
	executeSmallEvent: (interaction: CommandInteraction, language: Language, player: Player, seEmbed: DraftBotEmbed) => Promise<void>;

	/**
	 * Says by whom the small event can be obtained
	 * @param player
	 */
	canBeExecuted: (player: Player) => Promise<boolean>;
}