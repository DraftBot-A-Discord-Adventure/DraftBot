import {SmallEvent} from "./SmallEvent";
import Entity from "../database/game/models/Entity";
import {CommandInteraction} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {Translations} from "../Translations";
import {MissionsController} from "../missions/MissionsController";

export const smallEvent: SmallEvent = {
	/**
	 * You must have an empty mission slot to have this small event
	 */
	canBeExecuted(entity: Entity): Promise<boolean> {
		return Promise.resolve(entity.Player.hasEmptyMissionSlot());
	},

	/**
	 * Find a new mission
	 * @param interaction
	 * @param language
	 * @param entity
	 * @param seEmbed
	 */
	async executeSmallEvent(interaction: CommandInteraction, language: string, entity: Entity, seEmbed: DraftBotEmbed): Promise<void> {
		const tr = Translations.getModule("smallEvents.findMission", language);
		const intro = Translations.getModule("smallEventsIntros", language).getRandom("intro");
		const missionSlot = await MissionsController.addRandomMissionToPlayer(entity, MissionsController.getRandomDifficulty(entity.Player));
		seEmbed.setDescription(
			seEmbed.data.description
			+ intro
			+ tr.getRandom("intrigue")
			+ "\n\n**"
			+ await missionSlot.Mission.formatDescription(missionSlot.missionObjective, missionSlot.missionVariant, language, missionSlot.saveBlob)
			+ "**"
		);
		await interaction.editReply({embeds: [seEmbed]});
	}
};