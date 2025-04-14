import InventoryInfo from "../../../../core/database/game/models/InventoryInfo";
import InventorySlot from "../../../../core/database/game/models/InventorySlot";
import Player from "../../../../core/database/game/models/Player";
import MissionSlot from "../../../../core/database/game/models/MissionSlot";
import PlayerMissionsInfo from "../../../../core/database/game/models/PlayerMissionsInfo";
import {
	ExecuteTestCommandLike, ITestCommand
} from "../../../../core/CommandsTest";

export const commandInfo: ITestCommand = {
	name: "destroyplayer",
	aliases: ["destroy"],
	description: "Réinitialise votre joueur"
};

/**
 * Reset the player
 */
const destroyPlayerTestCommand: ExecuteTestCommandLike = async player => {
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
			id: player.id
		}
	});
	return "Vous avez été réinitialisé !";
};

commandInfo.execute = destroyPlayerTestCommand;
