import {IMission} from "../IMission";
import {hoursToMilliseconds} from "../../../../../Lib/src/utils/TimeUtils";

const saveBlobFromData = function(startTimestamp: number, startMap: number): Buffer {
	const saveBlob = Buffer.alloc(10);
	saveBlob.writeBigUInt64LE(BigInt(startTimestamp));
	saveBlob.writeUInt16LE(startMap, 8);
	return saveBlob;
};

const dataFromSaveBlob = function(saveBlob: Buffer): { startTimestamp: number, startMap: number } {
	return {
		startTimestamp: Number(saveBlob.readBigUInt64LE()),
		startMap: saveBlob.readUInt16LE(8)
	};
};

const paramsFromVariant = function(variant: number): {
	fromMap: number,
	toMap: number,
	time: number,
	orderMatter: boolean
} {
	return {
		fromMap: variant >> 20 & 0x3ff,
		toMap: variant >> 10 & 0x3ff,
		time: variant & 0x3ff,
		orderMatter: (variant & 0x40000000) !== 0
	};
};


export const missionInterface: IMission = {
	areParamsMatchingVariantAndBlob: (variant, params, saveBlob) => {
		if (!saveBlob) {
			return false;
		}
		const variantParams = paramsFromVariant(variant);
		const saveData = dataFromSaveBlob(saveBlob);
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
		const variantParams = paramsFromVariant(variant);
		if (!saveBlob) {
			if (params.mapId === variantParams.fromMap || !variantParams.orderMatter && params.mapId === variantParams.toMap) {
				return saveBlobFromData(Date.now(), params.mapId);
			}
			return null;
		}
		const saveData = dataFromSaveBlob(saveBlob);
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
