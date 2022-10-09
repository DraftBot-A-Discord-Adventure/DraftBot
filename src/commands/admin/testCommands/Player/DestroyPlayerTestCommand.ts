import InventoryInfo from "../../../../core/database/game/models/InventoryInfo";
import InventorySlot from "../../../../core/database/game/models/InventorySlot";
import Player, {Players} from "../../../../core/database/game/models/Player";
import MissionSlot from "../../../../core/database/game/models/MissionSlot";
import PlayerMissionsInfo from "../../../../core/database/game/models/PlayerMissionsInfo";
import {CommandInteraction} from "discord.js";
import {ITestCommand} from "../../../../core/CommandsTest";

export const commandInfo: ITestCommand = {
	name: "destroyplayer",
	aliases: ["destroy"],
	commandFormat: "",
	messageWhenExecuted: "Vous avez été réinitialisé !",
	description: "Réinitialise votre joueur",
	commandTestShouldReply: true,
	execute: null // defined later
};

/**
 * Reset the player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @return {String} - The successful message formatted
 */
const destroyPlayerTestCommand = async (language: string, interaction: CommandInteraction): Promise<string> => {
	const [player] = await Players.getOrRegister(interaction.user.id);
	await MissionSlot.destroy({
		where: {
			playerId: player.id
		}
	});
	await PlayerMissionsInfo.destroy({
		where: {
			playerId: player.id
		}
	});
	await InventorySlot.destroy({
		where: {
			playerId: player.id
		}
	});
	await InventoryInfo.destroy({
		where: {
			playerId: player.id
		}
	});
	await MissionSlot.destroy({
		where: {
			playerId: player.id
		}
	});
	await PlayerMissionsInfo.destroy({
		where: {
			playerId: player.id
		}
	});
	await Player.destroy({
		where: {
			entityId: player.id
		}
	});
	return commandInfo.messageWhenExecuted;
};

commandInfo.execute = destroyPlayerTestCommand;