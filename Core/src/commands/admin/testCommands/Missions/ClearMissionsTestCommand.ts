import {
	ExecuteTestCommandLike, ITestCommand
} from "../../../../core/CommandsTest";
import { MissionSlots } from "../../../../core/database/game/models/MissionSlot";

export const commandInfo: ITestCommand = {
	name: "clearMissions",
	description: "Permet de supprimer toutes ses missions"
};

/**
 * Set the weapon of the player
 */
const clearMissionsTestCommand: ExecuteTestCommandLike = async player => {
	const missionSlots = await MissionSlots.getOfPlayer(player.id);

	for (const missionSlot of missionSlots) {
		if (!missionSlot.isCampaign()) {
			await missionSlot.destroy();
		}
	}

	return "Toutes vos missions ont été supprimées !";
};

commandInfo.execute = clearMissionsTestCommand;
