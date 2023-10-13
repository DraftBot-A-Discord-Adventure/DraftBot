import {DataController} from "./DataController";
import {Data} from "./Data";
import {PetEntityConstants} from "../core/constants/PetEntityConstants";
import {RandomUtils} from "../core/utils/RandomUtils";

export class Pet extends Data<number> {
    declare readonly rarity: number;

    declare readonly emoteMale: string;

    declare readonly emoteFemale: string;

    declare readonly diet: string;


    public getRarityDisplay(): string {
        return PetEntityConstants.EMOTE.RARITY.repeat(this.rarity);
    }

    /**
     * Returns true if the pet can eat meat
     */
    public canEatMeat(): boolean {
        return this.diet === PetEntityConstants.RESTRICTIVES_DIETS.CARNIVOROUS || !this.diet;
    }

    /**
     * Returns true if the pet can eat vegetables
     */
    public canEatVegetables(): boolean {
        return this.diet === PetEntityConstants.RESTRICTIVES_DIETS.HERBIVOROUS || !this.diet;
    }
}

export class PetDataController extends DataController<number, Pet> {
    static readonly instance: PetDataController = new PetDataController("pets");

    private maxIdCache: number = null;

    newInstance(): Pet {
        return new Pet();
    }

    public getMaxId(): number {
        if (this.maxIdCache === null) {
            this.maxIdCache = Math.max(...[...this.data.keys()].map(armor => armor))
        }

        return this.maxIdCache;
    }

    /**
     * Get a random pet
     */
    public getRandom(rarity: number = -1): Pet {
        let pets = this.getValuesArray();
        if (rarity !== -1) {
            pets = pets.filter((pet) => pet.rarity === rarity);
        }
        return RandomUtils.draftbotRandom.pick(pets);
    }
}