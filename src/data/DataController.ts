import {readdirSync, readFileSync} from "fs";
import {Data} from "./Data";
import {GenericItem} from "./GenericItem";

export abstract class DataController<T extends string | number, U extends Data> {
    private readonly junkVariable: T; // Variable only used for typeof. Doesn't contain any value

    protected data: Map<T, U> = new Map<T, U>();

    private valuesArrayCache: U[] = null;

    protected constructor(folder: string) {
        for (const file of readdirSync(`resources/${folder}`)) {
            let key: string | number;
            if (typeof this.junkVariable === "string") {
                key = file;
            }
            else {
                key = parseInt(file);
            }

            const instance = this.newInstance();
            this.toInstance(<T> key, instance, readFileSync(file).toString("utf8"));

            this.data.set(<T> key, instance);
        }
    }

    private toInstance(id: T, obj: U, json: string): void {
        const jsonObj = JSON.parse(json);

        for (const propName in jsonObj) {
            // @ts-ignore
            obj[propName] = jsonObj[propName]
        }

        // @ts-ignore
        obj["id"] = id;
    }

    abstract newInstance(): U;

    public getById(id: T) {
        return this.data.get(id);
    }

    protected getValuesArray(): U[] {
        if (this.valuesArrayCache === null) {
            this.valuesArrayCache = Array.from(this.data.values());
        }

        return this.valuesArrayCache;
    }
}

export abstract class ItemDataController<T extends number, U extends GenericItem> extends DataController<T, U> {
    private maxIdCache: number = null;

    private idsForRarityCache: Map<number, number[]> = null;

    public getMaxId(): number {
        if (this.maxIdCache === null) {
            this.maxIdCache = Math.max(...[...this.data.keys()].map(armor => armor))
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