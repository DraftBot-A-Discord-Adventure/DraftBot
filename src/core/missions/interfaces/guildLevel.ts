import {IMission} from "../IMission";
import Player from "../../models/Player";
import {Guilds} from "../../models/Guild";

export const missionInterface: IMission = {
	areParamsMatchingVariantAndSave(): boolean {
		return true;
	},

	getVariantFormatVariable(): Promise<string> {
		return Promise.resolve("");
	},

	generateRandomVariant(): Promise<number> {
		return Promise.resolve(0);
	},

	async initialNumberDone(player: Player): Promise<number> {
		const guild = await Guilds.getById(player.guildId);
		return guild ? guild.level : 0;
	},

	updateSaveBlob(): Promise<Buffer> {
		return Promise.resolve(null);
	}
};