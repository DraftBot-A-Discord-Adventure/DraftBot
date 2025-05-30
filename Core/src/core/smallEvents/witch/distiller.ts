import { WitchActionFuncs } from "../../../data/WitchAction";
import {
	ItemNature, ItemRarity
} from "../../../../../Lib/src/constants/ItemConstants";

export const witchSmallEvent: WitchActionFuncs = {
	generatePotion: () => ({
		minRarity: ItemRarity.RARE,
		maxRarity: ItemRarity.LEGENDARY,
		subType: ItemNature.TIME_SPEEDUP
	})
};
