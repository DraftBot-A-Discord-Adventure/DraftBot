import { WitchActionFuncs } from "../../../data/WitchAction";
import {
	ItemNature, ItemRarity
} from "../../../../../Lib/src/constants/ItemConstants";

export const witchSmallEvent: WitchActionFuncs = {
	generatePotion: () => ({
		maxRarity: ItemRarity.UNCOMMON,
		nature: ItemNature.DEFENSE
	})
};
