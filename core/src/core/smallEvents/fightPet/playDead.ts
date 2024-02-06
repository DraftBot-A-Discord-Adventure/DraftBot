import {FightPetActionFunc} from "../../../data/FightPetAction";
import {RandomUtils} from "../../utils/RandomUtils";

export const fightPetAction: FightPetActionFunc = (player) => RandomUtils.draftbotRandom.bool(1 - player.health / player.getMaxHealth());