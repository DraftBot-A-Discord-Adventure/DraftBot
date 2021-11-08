import {DraftBotEmbed} from "../../../../core/messages/DraftBotEmbed";
import {Entities} from "../../../../core/models/Entity";
import {MissionsController} from "../../../../core/missions/MissionsController";
import {format} from "../../../../core/utils/StringFormatter";
import {Missions} from "../../../../core/models/Mission";
import {Constants} from "../../../../core/Constants";

export const commandInfo = {
	name: "giveRandomMission",
	aliases: ["grm"],
	commandFormat: "<difficulty>",
	typeWaited: {
		difficulty: typeVariable.INTEGER
	},
	messageWhenExecuted: "Vous avez reçu la mission suivante:\n**Description :** {desc}\n**Objectif :** {objective}",
	description: "Donne une mission aléatoire"
};

const giveRandomMissionTestCommand = async (language, message, args) => {

	const [entity] = await Entities.getOrRegister(message.author.id);
	if (!entity.Player.hasEmptyMissionSlot()) {
		throw new Error("Les slots de mission du joueur sont tous pleins");
	}
	const difficulty = parseInt(args[0]);
	if (isNaN(difficulty) || difficulty < Constants.MISSION.MIN_DIFFICULTY || difficulty > Constants.MISSION.MAX_DIFFICULTY) {
		throw new Error("Difficulté incorrecte, elle doit être entre " + Constants.MISSION.MIN_DIFFICULTY + " et " + Constants.MISSION.MAX_DIFFICULTY);
	}
	const missionSlot = await MissionsController.addRandomMissionToPlayer(entity.Player, difficulty);
	const mission = await Missions.getById(missionSlot.missionId);

	return format(module.exports.commandInfo.messageWhenExecuted, {
		desc: mission.formatDescription(missionSlot.missionObjective, language),
		objective: missionSlot.missionObjective
	});
};

module.exports.execute = giveRandomMissionTestCommand;
