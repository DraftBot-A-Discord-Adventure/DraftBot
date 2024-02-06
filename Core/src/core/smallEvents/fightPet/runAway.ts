import {FightPetActionFunc} from "../../../data/FightPetAction";
import {InventorySlots} from "../../database/game/models/InventorySlot";
import {RandomUtils} from "../../utils/RandomUtils";
import {SmallEventConstants} from "../../constants/SmallEventConstants";

export const fightPetAction: FightPetActionFunc = async (player, pet) => RandomUtils.draftbotRandom.bool(
	Math.max(
		player.getCumulativeSpeed(await InventorySlots.getPlayerActiveObjects(player.id)) / SmallEventConstants.FIGHT_PET.RUN_AWAY_SPEED_BONUS_THRESHOLD * pet.rarity,
		SmallEventConstants.FIGHT_PET.MAXIMUM_STATS_BASED_ACTIONS_CHANCES
	)
);