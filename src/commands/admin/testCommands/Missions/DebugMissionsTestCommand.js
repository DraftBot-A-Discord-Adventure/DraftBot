import {DraftBotEmbed} from "../../../../core/messages/DraftBotEmbed";
import {Entities} from "../../../../core/models/Entity";

module.exports.commandInfo = {
	name: "debugMissions",
	aliases: ["debugm", "debm"],
	commandFormat: "",
	messageWhenExecuted: "",
	description: "Affiche des informations sur vos missions"
};

/**
 * Print missions info
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {Message} message - Message from the discord server
 * @return {String} - The successful message formatted
 */
const debugMissionsTestCommand = async (language, message) => {

	const [entity] = await Entities.getOrRegister(message.author.id);

	const embed = new DraftBotEmbed();
	embed.setTitle("Debug missions");
	embed.addField("⚙️ General", "\nDaily mission done: " + "Mission slots: " + entity.Player.getMissionSlots() +
		entity.Player.PlayerMissionsInfo.dailyMissionNumberDone +
		"\nLast daily mission done: " + entity.Player.PlayerMissionsInfo.lastDailyMissionCompleted +
		"\nGems count: " + entity.Player.PlayerMissionsInfo.gems +
		"\nCampaign progression: " + entity.Player.PlayerMissionsInfo.campaignProgression, false);
	let missionsFieldContent = "";
	if (entity.Player.MissionSlots.length === 0) {
		missionsFieldContent = "Aucune mission";
	}
	else {
		for (let i = 0; i < entity.Player.MissionSlots.length; ++i) {
			missionsFieldContent += await entity.Player.MissionSlots[i].Mission.formatDescription(entity.Player.MissionSlots[i].missionObjective,
				entity.Player.MissionSlots[i].missionVariant, language) +
				" (id: " + entity.Player.MissionSlots[i].missionId +
				")\n-> Variant: " + entity.Player.MissionSlots[i].missionVariant +
				"\n-> Number done: " + entity.Player.MissionSlots[i].numberDone +
				"\n-> Objective: " + entity.Player.MissionSlots[i].missionObjective +
				"\n-> Expiration date: " + (entity.Player.MissionSlots[i].expiresAt ? new Date(entity.Player.MissionSlots[i].expiresAt).toISOString() : "Never") +
				"\n-> Campaign only: " + entity.Player.MissionSlots[i].Mission.campaignOnly + "\n\n";
		}
	}
	embed.addField("📜 Missions", missionsFieldContent);
	message.channel.send({embeds: [embed]});
};

module.exports.execute = debugMissionsTestCommand;
