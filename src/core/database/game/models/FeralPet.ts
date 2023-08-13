import Pet from "./Pet";

export interface FeralPet {
	feralName: string,
	originalPet: Pet,
	isFemale: boolean
}