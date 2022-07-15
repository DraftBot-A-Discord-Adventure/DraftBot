import {IMission} from "../IMission";
import {MapLocations} from "../../models/MapLocation";
import {Translations} from "../../Translations";
import {hoursToMilliseconds} from "../../utils/TimeUtils";

export const missionInterface: IMission = {
	areParamsMatchingVariantAndSave(variant: number, params: { [key: string]: any }, saveBlob: Buffer): boolean {
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

	async getVariantFormatVariable(variant: number, objective: number, language: string, saveBlob: Buffer): Promise<string> {
		const tr = Translations.getModule("models.missions", language);
		const variantParams = paramsFromVariant(variant);
		const saveData = saveBlob ? dataFromSaveBlob(saveBlob) : null;
		if (!saveBlob || saveData.startTimestamp + hoursToMilliseconds(variantParams.time) < Date.now()) {
			const place1 = (await MapLocations.getById(variantParams.fromMap)).getNameWithoutEmote(language);
			const place2 = (await MapLocations.getById(variantParams.toMap)).getNameWithoutEmote(language);
			if (variantParams.orderMatter) {
				return Promise.resolve(tr.format("fromPlaceToPlaceMission.baseOrder", {
					place1,
					place2,
					time: variantParams.time
				}));
			}
			return Promise.resolve(tr.format("fromPlaceToPlaceMission.baseNoOrder", {
				place1,
				place2,
				time: variantParams.time
			}));
		}
		return Promise.resolve(tr.format("fromPlaceToPlaceMission.toPlace", {
			place: saveData.startMap === variantParams.fromMap ?
				(await MapLocations.getById(variantParams.toMap)).getNameWithoutEmote(language) :
				(await MapLocations.getById(variantParams.fromMap)).getNameWithoutEmote(language),
			timestamp: Math.round(saveData.startTimestamp / 1000) + variantParams.time * 60 * 60
		}));
	},

	generateRandomVariant(): Promise<number> {
		return Promise.resolve(0);
	},

	initialNumberDone(): Promise<number> {
		return Promise.resolve(0);
	},

	updateSaveBlob(variant: number, saveBlob: Buffer, params: { [key: string]: any }): Promise<Buffer> {
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

const dataFromSaveBlob = function(saveBlob: Buffer): { startTimestamp: number, startMap: number } {
	return {
		startTimestamp: Number(saveBlob.readBigUInt64LE()),
		startMap: saveBlob.readUInt16LE(8)
	};
};

const saveBlobFromData = function(startTimestamp: number, startMap: number): Buffer {
	const saveBlob = Buffer.alloc(10);
	saveBlob.writeBigUInt64LE(BigInt(startTimestamp));
	saveBlob.writeUInt16LE(startMap, 8);
	return saveBlob;
};


const paramsFromVariant = function(variant: number): { fromMap: number, toMap: number, time: number, orderMatter: boolean } {
	return {
		fromMap: variant >> 20 & 0x3ff,
		toMap: variant >> 10 & 0x3ff,
		time: variant & 0x3ff,
		orderMatter: (variant & 0x40000000) !== 0
	};
};
// TODO: supprimmer les commentaires avec du code mort
// May be useful latter
/* const variantFromParams = function(fromMap: number, toMap: number, time: number, orderMatter: boolean): number {
	return (fromMap & 0x3ff) << 20 | (toMap & 0x3ff) << 10 | time & 0x3ff | (orderMatter ? 1 : 0) << 31;
};*/