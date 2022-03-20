import {Entities} from "../../../../core/models/Entity";
import {MissionsController} from "../../../../core/missions/MissionsController";
import {format} from "../../../../core/utils/StringFormatter";
import {Missions} from "../../../../core/models/Mission";

export const commandInfo = {
	name: "updateMissions",
	aliases: ["updateMission", "um"],
	commandFormat: "<mission id> <count>",
	typeWaited: {
		"mission id": typeVariable.STRING,
		count: typeVariable.INTEGER
	},
	messageWhenExecuted: "Vous avez avancé de {count} vos missions {missionId}",
	description: "Avance les missions"
};

const updateMissionsTestCommand = async (language, interaction, args) => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);
	const mission = await Missions.getById(args[0]);
	if (!mission) {
		throw new Error("mission id inconnu");
	}
	const count = parseInt(args[1]);
	await MissionsController.update(entity.discordUserId, interaction.channel, language, args[0], count);

	return format(module.exports.commandInfo.messageWhenExecuted, {
		missionId: args[0],
		count
	});
};

module.exports.execute = updateMissionsTestCommand;
