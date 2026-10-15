import { AiPlayerFighter } from "./AiPlayerFighter";
import Player from "../../database/game/models/Player";
import { Class } from "../../../data/Class";
import { PlayerActiveObjects } from "../../database/game/models/PlayerActiveObjects";

/**
 * AI-controlled fighter generated on the fly when /fight finds no opponent.
 * Its player is never persisted: everything the fight needs is preloaded.
 */
export class KingGuardFighter extends AiPlayerFighter {
	private readonly activeObjects: PlayerActiveObjects;

	public constructor(guard: Player, guardClass: Class, activeObjects: PlayerActiveObjects) {
		super(guard, guardClass, {
			allowPotionConsumption: false,
			preloadedActiveObjects: activeObjects,
			preloadedPetEntity: null
		});
		this.activeObjects = activeObjects;
	}

	/**
	 * No glory is at stake against a king guard
	 */
	public override getDisplayedGloryPoints(): number | undefined {
		return undefined;
	}

	public override getMainActiveObjects(): Promise<PlayerActiveObjects> {
		return Promise.resolve(this.activeObjects);
	}

	protected override countItemsWithTag(tag: string): Promise<number> {
		const equippedItems = [
			this.activeObjects.weapon.item,
			this.activeObjects.armor.item,
			this.activeObjects.potion.item,
			this.activeObjects.object.item
		];
		return Promise.resolve(equippedItems.filter(item => item.tags?.includes(tag)).length);
	}
}
