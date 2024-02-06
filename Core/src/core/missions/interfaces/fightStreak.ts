import {IMission} from "../IMission";
import {getDayNumber} from "../../../../../Lib/src/utils/TimeUtils";

export const missionInterface: IMission = {
	areParamsMatchingVariantAndSave(): boolean {
		return true;
	},

	generateRandomVariant(): Promise<number> {
		return Promise.resolve(0);
	},

	initialNumberDone(): Promise<number> {
		return Promise.resolve(0);
	},

	updateSaveBlob(): Promise<Buffer> {
		const buffer = Buffer.alloc(4);
		buffer.writeInt32LE(getDayNumber());
		return Promise.resolve(buffer);
	}
};
