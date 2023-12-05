import {WitchActionFuncs} from "../../../data/WitchAction";
import {ItemNature, ItemRarity} from "../../constants/ItemConstants";
import {RandomUtils} from "../../utils/RandomUtils";

export const witchSmallEvent: WitchActionFuncs = {
	generatePotion: () => ({
		minRarity: ItemRarity.RARE,
		maxRarity: ItemRarity.SPECIAL,
		nature: RandomUtils.draftbotRandom.bool(0.625) ? ItemNature.SPEED : ItemNature.TIME_SPEEDUP
	})
};
