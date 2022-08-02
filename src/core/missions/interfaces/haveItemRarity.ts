import {IMission} from "../IMission";
import {Translations} from "../../Translations";
import {haveRarityOrMore} from "../../utils/ItemUtils";
import Player from "../../database/game/models/Player";

export const missionInterface: IMission = {
	generateRandomVariant: () => Promise.resolve(0),

	areParamsMatchingVariantAndSave: (variant: number, params: { [key: string]: any }) => params.rarity >= variant,

	getVariantFormatVariable: (variant: number, objective: number, language: string) => Promise.resolve(Translations.getModule("items", language).getFromArray("rarities", variant)),

	async initialNumberDone(player: Player, variant: number) {
		return await haveRarityOrMore(player.InventorySlots, variant) ? 1 : 0;
	},

	updateSaveBlob(): Promise<Buffer> {
		return Promise.resolve(null);
	}
};