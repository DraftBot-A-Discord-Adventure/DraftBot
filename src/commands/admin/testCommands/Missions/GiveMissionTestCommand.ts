import {CommandInteraction} from "discord.js";
import {Constants} from "../../../../core/Constants";
import {Entities} from "../../../../core/database/game/models/Entity";
import {MissionsController} from "../../../../core/missions/MissionsController";
import {MissionDifficulty} from "../../../../core/missions/MissionDifficulty";
import Mission from "../../../../core/database/game/models/Mission";
import {format} from "../../../../core/utils/StringFormatter";
import {ITestCommand} from "../../../../core/CommandsTest";

export const commandInfo: ITestCommand = {
	name: "giveMission",
	aliases: ["gm"],
	commandFormat: "<mission id> <difficulty>",
	typeWaited: {
		"mission id": Constants.TEST_VAR_TYPES.STRING,
		"difficulty": Constants.TEST_VAR_TYPES.STRING
	},
	messageWhenExecuted: "Vous avez reçu la mission suivante:\n**Description :** {desc}\n**Objectif :** {objective}",
	description: "Permet de se donner une mission spécifique",
	commandTestShouldReply: true,
	execute: null // defined later
};

/**
 * Set the weapon of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const giveMissionTestCommand = async (language: string, interaction: CommandInteraction, args: string[]): Promise<string> => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);

	const missionId = args[0];
	const mission = await Mission.findOne({where: {id: missionId}});
	if (!mission) {
		throw new Error("Id de mission inconnu !");
	}
	if (mission.campaignOnly) {
		throw new Error("Cette mission n'est disponible que pour la campagne !");
	}

	let difficulty = args[1];
	if (difficulty in ["easy", "medium", "hard"]) {
		difficulty = difficulty[0];
	}
	if (!difficulty || difficulty !== "e" && difficulty !== "m" && difficulty !== "h") {
		throw new Error("Difficulté incorrecte, elle doit être easy (e), medium (m) ou hard (h)");
	}

	const missionSlot = await MissionsController.addMissionToPlayer(entity, missionId,
		difficulty === "e" ? MissionDifficulty.EASY : difficulty === "m" ? MissionDifficulty.MEDIUM : MissionDifficulty.HARD);

	return format(commandInfo.messageWhenExecuted, {
		desc: await (await missionSlot.getMission()).formatDescription(missionSlot.missionObjective, missionSlot.missionVariant, language, null),
		objective: missionSlot.missionObjective
	});
};

commandInfo.execute = giveMissionTestCommand;