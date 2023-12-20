import {readdirSync, readFileSync} from "fs";
import {Data} from "./Data";
import {GenericItem} from "./GenericItem";

export abstract class DataController<T extends string | number, U extends Data<number | string>> {
	protected data: Map<T, U> = new Map<T, U>();

	private valuesArrayCache: U[] = null;

	protected constructor(type: string, folder: string) {
		for (const file of readdirSync(`resources/${folder}`)) {
			if (file.endsWith(".json")) {
				let key: string | number;
				const filenameWithoutExtension = file.substring(0, file.length - 5);
				if (type === "string") {
					key = filenameWithoutExtension;
				}
				else {
					key = parseInt(filenameWithoutExtension);
				}

				const instance = this.newInstance();
				this.toInstance(<T>key, instance, readFileSync(`resources/${folder}/${file}`)
					.toString("utf8"));

				this.data.set(<T>key, instance);
			}
		}
	}

	abstract newInstance(): U;

	public getById(id: T): U {
		return this.data.get(id);
	}

	protected getValuesArray(): U[] {
		if (this.valuesArrayCache === null) {
			this.valuesArrayCache = Array.from(this.data.values());
		}

		return this.valuesArrayCache;
	}

	private toInstance(id: T, obj: U, json: string): void {
		const jsonObj = JSON.parse(json);

		// eslint-disable-next-line guard-for-in
		for (const propName in jsonObj) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			obj[propName] = jsonObj[propName];
		}

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		obj.id = id;
	}
}

export abstract class DataControllerString<T extends Data<number | string>> extends DataController<string, T> {
	constructor(folder: string) {
		super("string", folder);
	}
}

export abstract class DataControllerNumber<T extends Data<number | string>> extends DataController<number, T> {
	constructor(folder: string) {
		super("number", folder);
	}
}

export abstract class ItemDataController<U extends GenericItem> extends DataControllerNumber<U> {
	private maxIdCache: number = null;

	private idsForRarityCache: Map<number, number[]> = null;

	public getMaxId(): number {
		if (this.maxIdCache === null) {
			this.maxIdCache = Math.max(...[...this.data.keys()].map(armor => armor));
		}

		return this.maxIdCache;
	}

	public getAllIdsForRarity(rarity: number): number[] {
		if (!this.idsForRarityCache.has(rarity)) {
			const items = [];
			for (const entry of this.data.entries()) {
				if (entry[1].rarity === rarity) {
					items.push(entry[0]);
				}
			}
			this.idsForRarityCache.set(rarity, items);
		}

		return this.idsForRarityCache.get(rarity);
	}
}