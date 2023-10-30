import {Pet} from "@Core/src/data/Pet";

export interface FeralPet {
	feralName: string,
	originalPet: Pet,
	isFemale: boolean
}