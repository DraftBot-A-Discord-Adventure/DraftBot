import {IMission} from "../IMission";

export const missionInterface: IMission = {
	generateRandomVariant: () => Promise.resolve(0),

	areParamsMatchingVariantAndSave: (variant: number, params: { [key: string]: string }, saveBlob: Buffer) => {
		if (!saveBlob) {
			return true;
		}
		return !saveBlob.toString().includes(params.metPlayerDiscordId);
	},

	getVariantFormatVariable: () => Promise.resolve(""),

	initialNumberDone: () => Promise.resolve(0),

	updateSaveBlob(variant: number, saveBlob: Buffer, params: { [key: string]: string }): Promise<Buffer> {
		if (!saveBlob) {
			return Promise.resolve(Buffer.from(params.metPlayerDiscordId));
		}
		return Promise.resolve(Buffer.concat([saveBlob, Buffer.from(`,${params.metPlayerDiscordId}`)]));
	}
};