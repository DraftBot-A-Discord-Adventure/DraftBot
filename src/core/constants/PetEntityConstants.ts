export abstract class PetEntityConstants {
	static readonly DEFAULT_PET_ID = 0;

	static readonly SLOTS = 6;

	static readonly EMOTE = {
		MALE: "♂️",
		FEMALE: "♀️",
		RARITY: "⭐"
	};

	static readonly PROBABILITIES = [
		[0.9000, 0.0900, 0.0090, 0.0009, 0.0001],
		[0.8940, 0.0916, 0.0109, 0.0023, 0.0012],
		[0.8760, 0.0964, 0.0166, 0.0065, 0.0045],
		[0.8460, 0.1044, 0.0262, 0.0135, 0.0099],
		[0.8040, 0.1156, 0.0396, 0.0233, 0.0175],
		[0.7500, 0.1300, 0.0568, 0.0359, 0.0273],
		[0.6840, 0.1476, 0.0778, 0.0513, 0.0393],
		[0.6060, 0.1684, 0.1026, 0.0695, 0.0535],
		[0.5160, 0.1924, 0.1312, 0.0905, 0.0699],
		[0.4140, 0.2196, 0.1637, 0.1143, 0.0884],
		[0.3000, 0.2500, 0.2000, 0.1409, 0.1091]
	];

	static RESTRICTIVES_DIETS:{
		CARNIVOROUS: "carnivorous",
		HERBIVOROUS: "herbivorous",
	};
}

export enum PET_ENTITY_GIVE_RETURN {
	NO_SLOT,
	GUILD,
	PLAYER
}