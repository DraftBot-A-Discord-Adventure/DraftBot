const {format} = require("../../../../core/utils/StringFormatter");
const {Constants} = require("../../../../core/Constants");
const {MissionsController} = require("../../../../core/missions/MissionsController");
const {Entities} = require("../../../../core/models/Entity");
module.exports.commandInfo = {
	name: "giveMission",
	aliases: ["gm"],
	commandFormat: "<mission id> <difficulty>",
	typeWaited: {
		"mission id": typeVariable.STRING,
		"difficulty": typeVariable.INTEGER
	},
	messageWhenExecuted: "Vous avez reçu la mission suivante:\n**Description :** {desc}\n**Objectif :** {objective}",
	description: "Permet de se donner une mission spécifique"
};

/**
 * Set the weapon of the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
const giveMissionTestCommand = async (language, message, args) => {
	const [entity] = await Entities.getOrRegister(message.author.id);

	const missionId = args[0];
	if (!JsonReader.missions[missionId]) {
		throw new Error("Id de mission inconnu !");
	}
	if (JsonReader.missions[missionId].campaignOnly === true) {
		throw new Error("Cette mission n'est disponible que pour la campagne !");
	}

	const difficulty = parseInt(args[1], 10);
	if (isNaN(difficulty) || difficulty < Constants.MISSION.MIN_DIFFICULTY || difficulty > Constants.MISSION.MAX_DIFFICULTY) {
		throw new Error("Difficulté incorrecte, elle doit être entre " + Constants.MISSION.MIN_DIFFICULTY + " et " + Constants.MISSION.MAX_DIFFICULTY);
	}

	const missionSlot = await MissionsController.addMissionToPlayer(entity.Player.id, missionId, difficulty);

	return format(module.exports.commandInfo.messageWhenExecuted, {
		desc: (await missionSlot.getMission()).formatDescription(missionSlot.missionObjective, language),
		objective: missionSlot.missionObjective
	});
};

module.exports.execute = giveMissionTestCommand;