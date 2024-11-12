import {IMission} from "../IMission";
import {hoursToMilliseconds} from "../../../../../Lib/src/utils/TimeUtils";
import {MissionUtils} from "../../../../../Lib/src/utils/MissionUtils";

const saveBlobFromData = function(startTimestamp: number, startMap: number): Buffer {
	const saveBlob = Buffer.alloc(10);
	saveBlob.writeBigUInt64LE(BigInt(startTimestamp));
	saveBlob.writeUInt16LE(startMap, 8);
	return saveBlob;
};

export const missionInterface: IMission = {
	areParamsMatchingVariantAndBlob: (variant, params, saveBlob) => {
		if (!saveBlob) {
			return false;
		}
		const variantParams = MissionUtils.fromPlaceToPlaceParamsFromVariant(variant);
		const saveData = MissionUtils.fromPlaceToPlaceDataFromSaveBlob(saveBlob);
		if (variantParams.orderMatter) {
			return variantParams.toMap === params.mapId && variantParams.fromMap === saveData.startMap
				&& saveData.startTimestamp + hoursToMilliseconds(variantParams.time) > Date.now();
		}
		return (variantParams.toMap === params.mapId && variantParams.fromMap === saveData.startMap
				|| variantParams.fromMap === params.mapId && variantParams.toMap === saveData.startMap)
			&& saveData.startTimestamp + hoursToMilliseconds(variantParams.time) > Date.now();
	},

	generateRandomVariant: () => 0,

	initialNumberDone: () => 0,

	updateSaveBlob: (variant, saveBlob, params) => {
		const variantParams = MissionUtils.fromPlaceToPlaceParamsFromVariant(variant);
		if (!saveBlob) {
			if (params.mapId === variantParams.fromMap || !variantParams.orderMatter && params.mapId === variantParams.toMap) {
				return saveBlobFromData(Date.now(), params.mapId);
			}
			return null;
		}
		const saveData = MissionUtils.fromPlaceToPlaceDataFromSaveBlob(saveBlob);
		if (saveData.startMap === params.mapId) {
			return saveBlobFromData(Date.now(), params.mapId);
		}
		if (saveData.startTimestamp + hoursToMilliseconds(variantParams.time) < Date.now()) {
			if (saveData.startMap === params.mapId) {
				return saveBlobFromData(Date.now(), params.mapId);
			}
			return null;
		}
		return saveBlob;
	}
};
