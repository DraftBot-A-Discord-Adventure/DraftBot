import { DailyMissions } from "../../../../core/database/game/models/DailyMission";
import {
	ExecuteTestCommandLike, ITestCommand
} from "../../../../core/CommandsTest";
import PlayerMissionsInfo from "../../../../core/database/game/models/PlayerMissionsInfo";

export const commandInfo: ITestCommand = {
	name: "newDailyMissions",
	aliases: ["ndm"],
	description: "Permet d'obtenir une nouvelle mission quotidienne"
};

/**
 * Set the weapon of the player
 */
const newDailyMissionTestCommand: ExecuteTestCommandLike = async () => {
	const newDM = await DailyMissions.regenerateDailyMission();
	await PlayerMissionsInfo.update({
		dailyMissionNumberDone: 0,
		lastDailyMissionCompleted: new Date(0)
	}, { where: {} });
	return `La mission quotidienne a été changée !\n Mission ID : ${newDM.id}`;
};

commandInfo.execute = newDailyMissionTestCommand;
