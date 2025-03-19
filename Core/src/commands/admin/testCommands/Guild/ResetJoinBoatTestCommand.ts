import {ExecuteTestCommandLike, ITestCommand} from "../../../../core/CommandsTest";
import {LogsPlayersTravels} from "../../../../core/database/logs/models/LogsPlayersTravels";
import {Op} from "sequelize";
import {getNextSundayMidnight} from "../../../../../../Lib/src/utils/TimeUtils";
import {MapLocationDataController} from "../../../../data/MapLocation";
import {MapConstants} from "../../../../../../Lib/src/constants/MapConstants";

export const commandInfo: ITestCommand = {
	name: "resetjoinboat",
	aliases: ["rjb"],
	description: "Réinitialise à 0 notre nombre d'allées sur l'île."
};

const resetJoinBoatTestCommand: ExecuteTestCommandLike = async (player) => {
	await LogsPlayersTravels.destroy({
		where: {
			"$LogsPlayer.keycloakId$": player.keycloakId,
			date: {
				[Op.gt]: Math.floor((getNextSundayMidnight() - 7 * 24 * 60 * 60 * 1000) / 1000)
			},
			"$LogsMapLink.start$": MapLocationDataController.instance.getWithAttributes([MapConstants.MAP_ATTRIBUTES.MAIN_CONTINENT])[0].id,
			"$LogsMapLink.end$": {
				[Op.in]: MapLocationDataController.instance.getWithAttributes([MapConstants.MAP_ATTRIBUTES.PVE_ISLAND_ENTRY])
					.map((mapLocation) => mapLocation.id)
			}
		}
	});
	return "Votre nombre d'allées sur l'île PVE a été réinitialisé";
};

commandInfo.execute = resetJoinBoatTestCommand;