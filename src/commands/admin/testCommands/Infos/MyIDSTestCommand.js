import {Entities} from "../../../../core/database/game/models/Entity";

/**
 * Show your entity's and player's IDs
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @return {String} - The successful message formatted
 */
const MyIDsTestCommand = async (language, interaction) => {
	const [entity] = await Entities.getOrRegister(interaction.user.id);
	return format(module.exports.commandInfo.messageWhenExecuted, {entityId: entity.id, playerId: entity.Player.id});
};

module.exports.commandInfo = {
	name: "myids",
	commandFormat: "",
	messageWhenExecuted: "Entity id: {entityId}\nPlayer id: {playerId}",
	description: "Montre vos IDs d'entité et de joueur",
	commandTestShouldReply: true,
	execute: MyIDsTestCommand
};