import { WitchActionFuncs } from "../../../data/WitchAction";
import { ItemNature } from "../../../../../Lib/src/constants/ItemConstants";

export const witchSmallEvent: WitchActionFuncs = {
	generatePotion: () => ({
		subType: ItemNature.NONE
	})
};
