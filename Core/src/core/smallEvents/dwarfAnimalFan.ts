import { SmallEventFuncs } from "../../data/SmallEvent";
import { Maps } from "../maps/Maps";
import Player from "../database/game/models/Player";
import {
	DraftBotPacket,
	makePacket
} from "../../../../Lib/src/packets/DraftBotPacket";
import {
	SmallEventDwarfAnimalFanPacket,
	SmallEventDwarfAnimalFanPetAlreadySeenOrNoPetPacket
} from "../../../../Lib/src/packets/smallEvents/SmallEventDwarfAnimalFanPacket";
import { PetEntities } from "../database/game/models/PetEntity";


async function isPetNeverSeen(response: DraftBotPacket[], player: Player): Promise<boolean> {
	if (!player.petId) {
		response.push(makePacket(SmallEventDwarfAnimalFanPetAlreadySeenOrNoPetPacket, {}));
		return false;
	}
	const petEntity = await PetEntities.getById(player.petId);

	// TODO : Faire le check si le pet est déjà vu.
	/**
	 * if(...) {
	 * response.push(makePacket(SmallEventDwarfAnimalFanPetAlreadySeenOrNoPetPacket, {}));
	 * return false;
	 */
	return true;
}

export const smallEventFuncs: SmallEventFuncs = {
	canBeExecuted: player => Maps.isOnContinent(player),
	executeSmallEvent: async (response, player, context): Promise<void> => {
		if (!await isPetNeverSeen(response, player)) {
			return;
		}
		const petEntity = await PetEntities.getById(player.petId);
		response.push(makePacket(SmallEventDwarfAnimalFanPacket, { petNickname: petEntity.nickname }));
	}
};
