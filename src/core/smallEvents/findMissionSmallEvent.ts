import {SmallEvent} from "./SmallEvent";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {Translations} from "../Translations";
import {MissionsController} from "../missions/MissionsController";
import Player from "../database/game/models/Player";
import {Missions} from "../database/game/models/Mission";
import {MissionSlots} from "../database/game/models/MissionSlot";
import {Maps} from "../maps/Maps";
import {DraftbotInteraction} from "../messages/DraftbotInteraction";

export const smallEvent: SmallEvent = {

	/**
	 * You must have an empty mission slot to have this small event
	 * @param player
	 *
	 */
	async canBeExecuted(player: Player): Promise<boolean> {
		return Maps.isOnContinent(player) && player.hasEmptyMissionSlot(await MissionSlots.getOfPlayer(player.id));
	},

	/**
	 * Find a new mission
	 * @param interaction
	 * @param language
	 * @param player
	 * @param seEmbed
	 */
	async executeSmallEvent(interaction: DraftbotInteraction, language: string, player: Player, seEmbed: DraftBotEmbed): Promise<void> {
		const tr = Translations.getModule("smallEvents.findMission", language);
		const intro = Translations.getModule("smallEventsIntros", language).getRandom("intro");
		const missionSlot = await MissionsController.addRandomMissionToPlayer(player, MissionsController.getRandomDifficulty(player));
		seEmbed.setDescription(
			`${seEmbed.data.description
			+ intro
			+ tr.getRandom("intrigue")}\n\n**${
				await (await Missions.getById(missionSlot.missionId)).formatDescription(missionSlot.missionObjective, missionSlot.missionVariant, language, missionSlot.saveBlob)
			}**`
		);
		await interaction.editReply({embeds: [seEmbed]});
	}
};