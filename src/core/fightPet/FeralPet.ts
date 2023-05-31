
/**
 * The base class for the creature you will fight in the fight pet event
 */
export abstract class FeralPet {
	public readonly name: string;


	protected constructor(name: string) {
		this.name = name;
	}

}