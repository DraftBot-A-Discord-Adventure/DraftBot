import {IMission} from "../IMission";
import {Translations} from "../../Translations";
import {haveRarityOrMore} from "../../utils/ItemUtils";
import Player from "../../models/Player";

export const missionInterface: IMission = {
	generateRandomVariant: () => 0,

	areParamsMatchingVariant: (variant: number, params: { [key: string]: any }) => params.rarity >= variant,

	getVariantFormatVariable: (variant: number, language: string) => Translations.getModule("items", language).getFromArray("rarities", variant),

	initialNumberDone: async (player: Player, variant: number) => await haveRarityOrMore(player.InventorySlots, variant) ? 1 : 0
};