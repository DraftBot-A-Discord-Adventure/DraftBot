import {SmallEventFuncs} from "../../data/SmallEvent";
import {Maps} from "../maps/Maps";
import {MissionSlots} from "../database/game/models/MissionSlot";
import {MissionsController} from "../missions/MissionsController";
import {makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {SmallEventFindMissionPacket} from "../../../../Lib/src/packets/smallEvents/SmallEventFindMissionPacket";

export const smallEventFuncs: SmallEventFuncs = {
	canBeExecuted: (player) => Maps.isOnContinent && player.hasEmptyMissionSlot(await MissionSlots.getOfPlayer(player.id)),
	executeSmallEvent: async (context, response, player): Promise<void> => {
		const missionGiven = await MissionsController.addRandomMissionToPlayer(player, MissionsController.getRandomDifficulty(player));
		response.push(makePacket(SmallEventFindMissionPacket, {
			// missionId =  Une fonction qui renvoie l'ID de la mission de missionGiven pour la retrouver en front
			// missionObjective =  Une fonction qui renvoie l'objectif de mission de missionGiven
		}
	}
};