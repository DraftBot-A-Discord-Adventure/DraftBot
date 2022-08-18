import {Entities} from "../../../../core/database/game/models/Entity";
import {Maps} from "../../../../core/Maps";
import {NumberChangeReason} from "../../../../core/database/logs/LogsDatabase";

module.exports.commandInfo = {
	name: "removeplayereffect",
	aliases: ["rmeffect"],
	messageWhenExecuted: "Vous n'avez plus d'effets !",
	description: "Enlève votre effet actuel",
	commandTestShouldReply: true
};

/**
 * Remove the effect of your player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @return {String} - The successful message formatted
 */
const removePlayerEffectTestCommand = async (language, interaction) => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);

	await Maps.removeEffect(entity.Player, NumberChangeReason.TEST);
	await entity.Player.save();
};

module.exports.execute = removePlayerEffectTestCommand;