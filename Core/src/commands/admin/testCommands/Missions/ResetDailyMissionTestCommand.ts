import {
	ExecuteTestCommandLike, ITestCommand
} from "../../../../core/CommandsTest";
import { PlayerMissionsInfos } from "../../../../core/database/game/models/PlayerMissionsInfo";

export const commandInfo: ITestCommand = {
	name: "resetDailyMission",
	aliases: ["rdm"],
	description: "Permet de réinitialiser la mission quootidienne"
};

/**
 * Set the weapon of the player
 */
const resetDailyMissionTextCommand: ExecuteTestCommandLike = async player => {
	const missionsInfo = await PlayerMissionsInfos.getOfPlayer(player.id);
	missionsInfo.dailyMissionNumberDone = 0;
	missionsInfo.lastDailyMissionCompleted = new Date(0);
	await missionsInfo.save();
	return "Votre mission quotidienne a été réinitiliasée !";
};

commandInfo.execute = resetDailyMissionTextCommand;
