import {IMission} from "../IMission";
import {Translations} from "../../Translations";
import {haveRarityOrMore} from "../../utils/ItemUtils";
import Player from "../../database/game/models/Player";
import {InventorySlots} from "../../database/game/models/InventorySlot";
import {Language} from "../../constants/TypeConstants";

export const missionInterface: IMission = {
	generateRandomVariant: () => Promise.resolve(0),

	areParamsMatchingVariantAndSave: (variant: number, params: { [key: string]: unknown }) => params.rarity >= variant,

	getVariantFormatVariable: (variant: number, objective: number, language: Language) => Promise.resolve(Translations.getModule("items", language).getFromArray("rarities", variant)),

	async initialNumberDone(player: Player, variant: number) {
		return await haveRarityOrMore(await InventorySlots.getOfPlayer(player.id), variant) ? 1 : 0;
	},

	updateSaveBlob(): Promise<Buffer> {
		return Promise.resolve(null);
	}
};