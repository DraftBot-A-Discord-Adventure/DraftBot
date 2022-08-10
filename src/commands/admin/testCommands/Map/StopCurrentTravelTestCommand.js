import {Entities} from "../../../../core/database/game/models/Entity";
import {Maps} from "../../../../core/Maps";

module.exports.commandInfo = {
	name: "stopcurrenttravel",
	aliases: ["stravel", "stoptravel"],
	commandFormat: "",
	messageWhenExecuted: "Vous avez arrêté de voyager !",
	description: "Stoppe le voyage en cours",
	commandTestShouldReply: true
};

/**
 * Stop your current travel
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @return {String} - The successful message formatted
 */
const stopCurrentTravelTestCommand = async (language, interaction) => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);
	if (!Maps.isTravelling(entity.Player)) {
		throw new Error("Erreur stoptravel : vous ne voyagez pas actuellement !");
	}

	await Maps.stopTravel(entity.Player);

	return module.exports.commandInfo.messageWhenExecuted;

};

module.exports.execute = stopCurrentTravelTestCommand;