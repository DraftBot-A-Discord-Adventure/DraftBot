import { IMission } from "../IMission";
import { getDayNumber } from "../../../../../Lib/src/utils/TimeUtils";

export const missionInterface: IMission = {
	areParamsMatchingVariantAndBlob: () => true,

	generateRandomVariant: () => 0,

	initialNumberDone: () => 0,

	updateSaveBlob: () => {
		const buffer = Buffer.alloc(4);
		buffer.writeInt32LE(getDayNumber());
		return buffer;
	}
};
