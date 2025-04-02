import { Pet } from "../../../../data/Pet";

export interface FeralPet {
	feralName: string;
	originalPet: Pet;
	isFemale: boolean;
}
