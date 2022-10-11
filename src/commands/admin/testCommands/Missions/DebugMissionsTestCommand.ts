import {DraftBotEmbed} from "../../../../core/messages/DraftBotEmbed";
import {CommandInteraction} from "discord.js";
import {ITestCommand} from "../../../../core/CommandsTest";
import {Players} from "../../../../core/database/game/models/Player";
import {PlayerMissionsInfos} from "../../../../core/database/game/models/PlayerMissionsInfo";
import {MissionSlots} from "../../../../core/database/game/models/MissionSlot";
import {Missions} from "../../../../core/database/game/models/Mission";

export const commandInfo: ITestCommand = {
	name: "debugMissions",
	aliases: ["debugm", "debm"],
	commandFormat: "",
	messageWhenExecuted: "",
	description: "Affiche des informations sur vos missions",
	commandTestShouldReply: true,
	execute: null // defined later
};

/**
 * Print missions info
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @return {String} - The successful message formatted
 */
const debugMissionsTestCommand = async (language: string, interaction: CommandInteraction): Promise<DraftBotEmbed> => {

	const [player] = await Players.getOrRegister(interaction.user.id);
	const missionsInfo = await PlayerMissionsInfos.getOfPlayer(player.id);
	const missionSlots = await MissionSlots.getOfPlayer(player.id);

	const embed = new DraftBotEmbed();
	embed.setTitle("Debug missions");
	embed.addFields({
		name: "⚙️ General",
		value: `\nDaily mission done: Mission slots: ${
			player.getMissionSlots()
		}${
			missionsInfo.dailyMissionNumberDone
		}\nLast daily mission done: ${
			missionsInfo.lastDailyMissionCompleted.toString()
		}\nGems count: ${
			missionsInfo.gems
		}\nCampaign progression: ${
			missionsInfo.campaignProgression
		}`,
		inline: false
	});
	let missionsFieldContent = "";
	if (missionSlots.length === 0) {
		missionsFieldContent = "Aucune mission";
	}
	else {
		for (let i = 0; i < missionSlots.length; ++i) {
			const mission = await Missions.getById(missionSlots[i].missionId);
			missionsFieldContent += `${
				await mission.formatDescription(missionSlots[i].missionObjective, missionSlots[i].missionVariant, language, null)
			} (id: ${
				missionSlots[i].missionId
			}\n				)\n-> ID DB: ${
				missionSlots[i].id
			}\n				\n-> Variant: ${
				missionSlots[i].missionVariant
			}\n				\n-> Number done: ${
				missionSlots[i].numberDone
			}\n				\n-> Objective: ${
				missionSlots[i].missionObjective
			}\n				\n-> Expiration date: ${
				missionSlots[i].expiresAt ? new Date(missionSlots[i].expiresAt).toISOString() : "Never"
			}\n				\n-> Campaign only: ${
				mission.campaignOnly
			}\n				\n-> Save blob: ${
				missionSlots[i].saveBlob
			}\n\n`;
		}
	}
	embed.addFields({name: "📜 Missions", value: missionsFieldContent});
	return embed;
};

commandInfo.execute = debugMissionsTestCommand;