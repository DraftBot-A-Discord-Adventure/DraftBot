import {SmallEvent} from "./SmallEvent";
import {CommandInteraction} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {Translations} from "../Translations";
import {MissionsController} from "../missions/MissionsController";
import Player from "../database/game/models/Player";
import {Missions} from "../database/game/models/Mission";
import {MissionSlots} from "../database/game/models/MissionSlot";

export const smallEvent: SmallEvent = {
	/**
	 * You must have an empty mission slot to have this small event
	 */ async canBeExecuted(player: Player): Promise<boolean> {
		return player.hasEmptyMissionSlot(await MissionSlots.getOfPlayer(player.id));
	},

	/**
	 * Find a new mission
	 * @param interaction
	 * @param language
	 * @param player
	 * @param seEmbed
	 */
	async executeSmallEvent(interaction: CommandInteraction, language: string, player: Player, seEmbed: DraftBotEmbed): Promise<void> {
		const tr = Translations.getModule("smallEvents.findMission", language);
		const intro = Translations.getModule("smallEventsIntros", language).getRandom("intro");
		const missionSlot = await MissionsController.addRandomMissionToPlayer(player, MissionsController.getRandomDifficulty(player));
		seEmbed.setDescription(
			seEmbed.data.description
			+ intro
			+ tr.getRandom("intrigue")
			+ "\n\n**"
			+ await (await Missions.getById(missionSlot.missionId)).formatDescription(missionSlot.missionObjective, missionSlot.missionVariant, language, missionSlot.saveBlob)
			+ "**"
		);
		await interaction.editReply({embeds: [seEmbed]});
	}
};