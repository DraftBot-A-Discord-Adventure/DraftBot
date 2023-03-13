import {SmallEvent} from "./SmallEvent";
import {CommandInteraction} from "discord.js";
import Player from "../database/game/models/Player";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {Data} from "../Data";
import {Translations} from "../Translations";

/**
 * A small event which just display a random text in the "stories" section of the small event json
 */
export abstract class SimpleTextSmallEvent implements SmallEvent {
	private smallEventName: string;

	constructor(smallEventName: string) {
		this.smallEventName = smallEventName;
	}

	/**
	 * No restrictions on who can do it
	 */
	abstract canBeExecuted(): Promise<boolean>;

	/**
	 * Execute small event
	 * @param interaction
	 * @param language
	 * @param player
	 * @param seEmbed
	 */
	async executeSmallEvent(interaction: CommandInteraction, language: string, player: Player, seEmbed: DraftBotEmbed): Promise<void> {
		seEmbed.setDescription(
			Data.getModule(`smallEvents.${this.smallEventName}`).getString("emote") +
			Translations.getModule(`smallEvents.${this.smallEventName}`, language).getRandom("stories"));
		await interaction.editReply({embeds: [seEmbed]});
	}
}