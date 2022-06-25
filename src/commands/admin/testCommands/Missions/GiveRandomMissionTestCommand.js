import {Entities} from "../../../../core/models/Entity";
import {MissionsController} from "../../../../core/missions/MissionsController";
import {format} from "../../../../core/utils/StringFormatter";
import {Missions} from "../../../../core/models/Mission";
import {MissionDifficulty} from "../../../../core/missions/MissionDifficulty";

export const commandInfo = {
	name: "giveRandomMission",
	aliases: ["grm"],
	commandFormat: "<difficulty>",
	typeWaited: {
		difficulty: typeVariable.STRING
	},
	messageWhenExecuted: "Vous avez reçu la mission suivante:\n**Description :** {desc}\n**Objectif :** {objective}",
	description: "Donne une mission aléatoire",
	commandTestShouldReply: true
};

const giveRandomMissionTestCommand = async (language, interaction, args) => {

	const [entity] = await Entities.getOrRegister(interaction.user.id);
	if (!entity.Player.hasEmptyMissionSlot()) {
		throw new Error("Les slots de mission du joueur sont tous pleins");
	}
	const difficulty = args[0];
	if (!difficulty || difficulty !== "e" && difficulty !== "m" && difficulty !== "h") {
		throw new Error("Difficulté incorrecte, elle doit être easy (e), medium (m) ou hard (h)");
	}
	const missionSlot = await MissionsController.addRandomMissionToPlayer(entity.Player,
		difficulty === "e" ? MissionDifficulty.EASY : difficulty === "m" ? MissionDifficulty.MEDIUM : MissionDifficulty.HARD);
	const mission = await Missions.getById(missionSlot.missionId);

	return format(module.exports.commandInfo.messageWhenExecuted, {
		desc: await mission.formatDescription(missionSlot.missionObjective, missionSlot.missionVariant, language),
		objective: missionSlot.missionObjective
	});
};

module.exports.execute = giveRandomMissionTestCommand;
