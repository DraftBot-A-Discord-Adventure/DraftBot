import {WitchActionFuncs} from "../../../data/WitchAction";
import {ItemRarity} from "../../constants/ItemConstants";

export const witchSmallEvent: WitchActionFuncs = {
	generatePotion: () => ({
		minRarity: ItemRarity.COMMON,
		maxRarity: ItemRarity.RARE,
		nature: null
	})
};
