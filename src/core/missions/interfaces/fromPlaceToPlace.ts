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

const paramsFromVariant = function(variant: number): { fromMap: number, toMap: number, time: number, orderMatter: boolean } {
	return {
		fromMap: variant >> 20 & 0x3ff,
		toMap: variant >> 10 & 0x3ff,
		time: variant & 0x3ff,
		orderMatter: (variant & 0x40000000) !== 0
	};
};


export const missionInterface: IMission = {
	areParamsMatchingVariantAndSave(variant: number, params: { [key: string]: unknown }, saveBlob: Buffer): boolean {
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

	generateRandomVariant(): Promise<number> {
		return Promise.resolve(0);
	},

	initialNumberDone(): Promise<number> {
		return Promise.resolve(0);
	},

	updateSaveBlob(variant: number, saveBlob: Buffer, params: { [key: string]: unknown }): Promise<Buffer> {
		const variantParams = paramsFromVariant(variant);
		if (!saveBlob) {
			if (params.mapId === variantParams.fromMap || !variantParams.orderMatter && params.mapId === variantParams.toMap) {
				return Promise.resolve(saveBlobFromData(Date.now(), params.mapId));
			}
			return Promise.resolve(null);
		}
		const saveData = dataFromSaveBlob(saveBlob);
		if (saveData.startMap === params.mapId) {
			return Promise.resolve(saveBlobFromData(Date.now(), params.mapId));
		}
		if (saveData.startTimestamp + hoursToMilliseconds(variantParams.time) < Date.now()) {
			if (saveData.startMap === params.mapId) {
				return Promise.resolve(saveBlobFromData(Date.now(), params.mapId));
			}
			return Promise.resolve(null);
		}
		return Promise.resolve(saveBlob);
	}
};
