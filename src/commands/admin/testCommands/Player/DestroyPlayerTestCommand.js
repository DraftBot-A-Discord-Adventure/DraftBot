import InventoryInfo from "../../../../core/models/InventoryInfo";
import Entity, {Entities} from "../../../../core/models/Entity";
import InventorySlot from "../../../../core/models/InventorySlot";
import Player from "../../../../core/models/Player";

module.exports.commandInfo = {
	name: "destroyplayer",
	aliases: ["destroy"],
	commandFormat: "",
	messageWhenExecuted: "Vous avez été réinitialisé !",
	description: "Réinitialise votre joueur"
};

/**
 * Reset the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @return {String} - The successful message formatted
 */
const destroyPlayerTestCommand = async (language, message) => {
	const [entity] = await Entities.getOrRegister(message.author.id);
	await InventorySlot.destroy({
		where: {
			playerId: entity.Player.id
		}
	});
	await InventoryInfo.destroy({
		where: {
			playerId: entity.Player.id
		}
	});
	await Player.destroy({
		where: {
			entityId: entity.id
		}
	});
	await Entity.destroy({
		where: {
			id: entity.id
		}
	});
	return module.exports.commandInfo.messageWhenExecuted;
};

module.exports.execute = destroyPlayerTestCommand;