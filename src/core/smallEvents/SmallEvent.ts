import {CommandInteraction} from "discord.js";
import Entity from "../database/game/models/Entity";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";

/**
 * Interface representing the strict minimum a small event needs
 */
export interface SmallEvent {
	/**
	 * The command representing the small event
	 * @param interaction
	 * @param language
	 * @param entity
	 * @param seEmbed
	 */
	executeSmallEvent: (interaction: CommandInteraction, language: string, entity: Entity, seEmbed: DraftBotEmbed) => Promise<void>;

	/**
	 * Says by whom the small event can be obtained
	 * @param entity
	 */
	canBeExecuted: (entity: Entity) => Promise<boolean>;
}