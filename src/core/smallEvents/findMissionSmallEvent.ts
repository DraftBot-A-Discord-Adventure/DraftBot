import {SmallEvent} from "./SmallEvent";
import Entity from "../models/Entity";
import {CommandInteraction} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {Translations} from "../Translations";
import {MissionsController} from "../missions/MissionsController";

export const smallEvent: SmallEvent = {
	canBeExecuted(entity: Entity): Promise<boolean> {
		return Promise.resolve(entity.Player.hasEmptyMissionSlot());
	},

	async executeSmallEvent(interaction: CommandInteraction, language: string, entity: Entity, seEmbed: DraftBotEmbed): Promise<void> {
		const tr = Translations.getModule("smallEvents.findMission", language);
		const intro = Translations.getModule("smallEventsIntros", language).getRandom("intro");
		const missionSlot = await MissionsController.addRandomMissionToPlayer(entity.Player, MissionsController.getRandomDifficulty(entity.Player));
		seEmbed.setDescription(
			seEmbed.description
			+ intro
			+ tr.getRandom("intrigue")
			+ "\n\n**"
			+ await missionSlot.Mission.formatDescription(missionSlot.missionObjective, missionSlot.missionVariant, language, missionSlot.saveBlob)
			+ "**"
		);
		await interaction.reply({ embeds: [seEmbed] });
	}
};