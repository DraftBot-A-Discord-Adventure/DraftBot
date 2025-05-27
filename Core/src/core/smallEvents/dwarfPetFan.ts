import { SmallEventFuncs } from "../../data/SmallEvent";
import { Maps } from "../maps/Maps";
import Player from "../database/game/models/Player";
import {
	DraftBotPacket,
	makePacket
} from "../../../../Lib/src/packets/DraftBotPacket";
import {
	SmallEventDwarfPetFanNoPet,
	SmallEventDwarfPetFanPacket,
	SmallEventDwarfPetFanPetAlreadySeen,
	SmallEventDwarfPetFanAllPetsSeen
} from "../../../../Lib/src/packets/smallEvents/SmallEventDwarfPetFanPacket";
import {
	PetEntities,
	PetEntity
} from "../database/game/models/PetEntity";
import { DwarfPetsSeen } from "../database/game/models/DwarfPetsSeen";
import { NumberChangeReason } from "../../../../Lib/src/constants/LogsConstants";
import { PlayerMissionsInfos } from "../database/game/models/PlayerMissionsInfo";
import { Constants } from "../../../../Lib/src/constants/Constants";

/**
 * Return true if the player has a pet AND the dwarf never saw this pet from it
 * @param response
 * @param player
 * @param petEntity
 */
async function isPlayerHavePetAndPetIsNeverSeen(response: DraftBotPacket[], player: Player, petEntity: PetEntity): Promise<boolean> {
	// Check if the player has a pet
	if (!player.petId) {
		response.push(makePacket(SmallEventDwarfPetFanNoPet, {}));
		return false;
	}

	// Check if the dwarf has already seen this pet
	if (await DwarfPetsSeen.isPetSeen(player, petEntity.typeId)) {
		response.push(makePacket(SmallEventDwarfPetFanPetAlreadySeen, {}));
		return false;
	}
	return true;
}

/**
 * Manage when the player has shown all the pets to the dwarf
 * @param response
 * @param player
 */
async function manageAllPetsAreSeen(response: DraftBotPacket[], player: Player): Promise<void> {
	await player.addMoney({
		amount: Constants.DWARF_PET_FAN.ALL_PETS_SEEN_REWARD,
		response,
		reason: NumberChangeReason.SMALL_EVENT
	});
	response.push(makePacket(SmallEventDwarfPetFanAllPetsSeen, {}));
}

/**
 * Manage when the player shows a new pet to the dwarf
 * @param response
 * @param player
 * @param petEntity
 */
async function manageNewPetSeen(response: DraftBotPacket[], player: Player, petEntity: PetEntity): Promise<void> {
	await DwarfPetsSeen.markPetAsSeen(player, petEntity.typeId);
	const missionInfo = await PlayerMissionsInfos.getOfPlayer(player.id);
	await missionInfo.addGems(
		Constants.DWARF_PET_FAN.NEW_PET_SEEN_REWARD,
		player.keycloakId,
		NumberChangeReason.SMALL_EVENT
	);
	response.push(makePacket(SmallEventDwarfPetFanPacket, { petNickname: petEntity.nickname }));
}

export const smallEventFuncs: SmallEventFuncs = {
	canBeExecuted: player => Maps.isOnContinent(player),
	executeSmallEvent: async (response, player, _context): Promise<void> => {
		// Check if the player has shown all the pets
		if (await DwarfPetsSeen.isAllPetSeen(player)) {
			await manageAllPetsAreSeen(response, player);
			return;
		}
		const petEntity = await PetEntities.getById(player.petId);

		if (!await isPlayerHavePetAndPetIsNeverSeen(response, player, petEntity)) {
			return;
		}
		await manageNewPetSeen(response, player, petEntity);
	}
};
