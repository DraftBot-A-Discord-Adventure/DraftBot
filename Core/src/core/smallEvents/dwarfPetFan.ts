import { SmallEventFuncs } from "../../data/SmallEvent";
import { Maps } from "../maps/Maps";
import Player from "../database/game/models/Player";
import {
	DraftBotPacket, makePacket
} from "../../../../Lib/src/packets/DraftBotPacket";
import { SmallEventDwarfPetFan } from "../../../../Lib/src/packets/smallEvents/SmallEventDwarfPetFanPacket";
import {
	PetEntities, PetEntity
} from "../database/game/models/PetEntity";
import { DwarfPetsSeen } from "../database/game/models/DwarfPetsSeen";
import { NumberChangeReason } from "../../../../Lib/src/constants/LogsConstants";
import { PlayerMissionsInfos } from "../database/game/models/PlayerMissionsInfo";
import { Constants } from "../../../../Lib/src/constants/Constants";
import { RandomUtils } from "../../../../Lib/src/utils/RandomUtils";
import { SexTypeShort } from "../../../../Lib/src/constants/StringConstants";
import { MapConstants } from "../../../../Lib/src/constants/MapConstants";
import { Badge } from "../../../../Lib/src/types/Badge";

/**
 * Return true if the player has a pet AND the pet is not feisty AND the dwarf never saw this pet from it
 * @param response
 * @param player
 * @param petEntity
 */
async function canContinueSmallEvent(response: DraftBotPacket[], player: Player, petEntity: PetEntity): Promise<boolean> {
	// Check if the player has shown all the pets
	if (await DwarfPetsSeen.isAllPetSeen(player)) {
		await manageAllPetsAreSeen(response, player, petEntity);
		return false;
	}

	// Check if the player has a pet
	if (!player.petId) {
		response.push(makePacket(SmallEventDwarfPetFan, { playerHavePet: false }));
		return false;
	}

	if (petEntity.isFeisty()) {
		response.push(makePacket(SmallEventDwarfPetFan, {
			playerHavePet: true,
			petNickname: petEntity.nickname,
			petSex: petEntity.sex as SexTypeShort,
			petTypeId: petEntity.typeId,
			isPetFeisty: true
		}));
		return false;
	}

	// Check if the dwarf has already seen this pet
	if (await DwarfPetsSeen.isPetSeen(player, petEntity.typeId)) {
		response.push(makePacket(SmallEventDwarfPetFan, {
			playerHavePet: true,
			petNickname: petEntity.nickname,
			petSex: petEntity.sex as SexTypeShort,
			petTypeId: petEntity.typeId
		}));
		return false;
	}
	return true;
}

/**
 * Manage when the player has shown all the pets to the dwarf
 * @param response
 * @param player
 * @param petEntity
 */
async function manageAllPetsAreSeen(response: DraftBotPacket[], player: Player, petEntity: PetEntity): Promise<void> {
	if (player.petId && petEntity.isFeisty()) {
		response.push(makePacket(SmallEventDwarfPetFan, {
			playerHavePet: true,
			petNickname: petEntity.nickname,
			petSex: petEntity.sex as SexTypeShort,
			petTypeId: petEntity.typeId,
			isPetFeisty: true
		}));
		return;
	}

	if (!player.hasBadge(Badge.ANIMAL_LOVER) && RandomUtils.draftbotRandom.bool(Constants.DWARF_PET_FAN.ALL_PETS_SEEN.BADGE_ANIMAL_LOVER_PROBABILITY)) {
		player.addBadge(Badge.ANIMAL_LOVER);
		response.push(makePacket(SmallEventDwarfPetFan, {
			arePetsAllSeen: {
				isGemReward: false, isBadgeReward: true
			}
		}));
		return;
	}

	// Give a gem
	if (RandomUtils.draftbotRandom.bool(Constants.DWARF_PET_FAN.ALL_PETS_SEEN.GEM_PROBABILITY)) {
		const missionInfo = await PlayerMissionsInfos.getOfPlayer(player.id);
		await missionInfo.addGems(
			Constants.DWARF_PET_FAN.ALL_PETS_SEEN.GEM_REWARD,
			player.keycloakId,
			NumberChangeReason.SMALL_EVENT
		);
		await missionInfo.save();
		response.push(makePacket(SmallEventDwarfPetFan, {
			arePetsAllSeen: {
				isGemReward: true, isBadgeReward: false
			},
			amount: Constants.DWARF_PET_FAN.ALL_PETS_SEEN.GEM_REWARD
		}));
		return;
	}

	// Give money
	await player.addMoney({
		amount: Constants.DWARF_PET_FAN.ALL_PETS_SEEN.MONEY_REWARD,
		response,
		reason: NumberChangeReason.SMALL_EVENT
	});
	await player.save();
	response.push(makePacket(SmallEventDwarfPetFan, {
		arePetsAllSeen: {
			isGemReward: false, isBadgeReward: false
		},
		amount: Constants.DWARF_PET_FAN.ALL_PETS_SEEN.MONEY_REWARD
	}));
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
	response.push(makePacket(SmallEventDwarfPetFan, {
		playerHavePet: true,
		amount: Constants.DWARF_PET_FAN.NEW_PET_SEEN_REWARD,
		petNickname: petEntity.nickname,
		petSex: petEntity.sex as SexTypeShort,
		petTypeId: petEntity.typeId,
		newPetSeen: true
	}));
}

export const smallEventFuncs: SmallEventFuncs = {
	canBeExecuted: player => {
		const destination = player.getDestination();
		const origin = player.getPreviousMap();
		return Maps.isOnContinent(player)
			&& [destination.id, origin.id].some(mapId =>
				[MapConstants.LOCATIONS_IDS.MOUNT_CELESTRUM].includes(mapId));
	},
	executeSmallEvent: async (response, player, _context): Promise<void> => {
		const petEntity = await PetEntities.getById(player.petId);
		if (!await canContinueSmallEvent(response, player, petEntity)) {
			return;
		}

		await manageNewPetSeen(response, player, petEntity);
	}
};
