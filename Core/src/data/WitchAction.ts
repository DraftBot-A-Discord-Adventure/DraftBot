import {DataControllerString} from "./DataController";
import {Data} from "./Data";
import {readdirSync} from "fs";
import {RandomUtils} from "../../../Lib/src/utils/RandomUtils";
import Player from "../core/database/game/models/Player";
import {SmallEventConstants} from "../../../Lib/src/constants/SmallEventConstants";
import {ItemNature, ItemRarity} from "../../../Lib/src/constants/ItemConstants";
import {DraftBotPacket} from "../../../Lib/src/packets/DraftBotPacket";
import {TravelTime} from "../core/maps/TravelTime";
import {NumberChangeReason} from "../../../Lib/src/constants/LogsConstants";
import {Effect} from "../../../Lib/src/types/Effect";
import {WitchActionOutcomeType} from "../../../Lib/src/types/WitchActionOutcomeType";

/**
 * The base class for the different events that can happen after the player encounters a feral pet
 */
export class WitchAction extends Data<string> {
	public readonly isIngredient: boolean;

	public readonly forceEffect: boolean;

	public readonly effectType: string;

	public readonly timePenalty: number;

	private outcomeProbabilities: OutcomeProbabilities;

	public generatePotionWitchAction(): PotionParameters | null {
		const withActionFunctions = WitchActionDataController.getWitchActionFunction(this.id);
		if (withActionFunctions && withActionFunctions.generatePotion) {
			return withActionFunctions.generatePotion();
		}

		return null;
	}

	public async checkMissionsWitchAction(player: Player, outcome: WitchActionOutcomeType, response: DraftBotPacket[]): Promise<void> {
		const withActionFunctions = WitchActionDataController.getWitchActionFunction(this.id);
		if (withActionFunctions && withActionFunctions.checkMissions) {
			await withActionFunctions.checkMissions(player, outcome, response, this.tags);
		}
	}

	public async giveEffect(player: Player): Promise<void> {
		await TravelTime.applyEffect(
			player,
			this.getEffectType(),
			this.timePenalty,
			new Date(),
			NumberChangeReason.SMALL_EVENT
		);
	}

	public generateOutcome(): WitchActionOutcomeType {
		const outcomeTypesKeys = Object.keys(WitchActionOutcomeType).map(k => k.toLowerCase());
		let outcome = 0;
		let seed = RandomUtils.randInt(0, SmallEventConstants.WITCH.MAX_PROBABILITY)
			- this.outcomeProbabilities[outcomeTypesKeys[WitchActionOutcomeType.POTION] as keyof WitchActionOutcomeType];
		while (seed > 0) {
			seed -= this.outcomeProbabilities[outcomeTypesKeys[outcome] as keyof WitchActionOutcomeType] ?? 0;
			outcome++;
		}
		return outcome;
	}

	public checkOutcomeProbabilities(): void {
		if (Object.values(this.outcomeProbabilities).reduce((sumProbability, probability) => sumProbability + probability) !== SmallEventConstants.WITCH.MAX_PROBABILITY) {
			throw new Error("The sum of the probabilities must be 50 for the witch event " + this.id);
		}
	}

	private getEffectType(): Effect {
		return Effect.getById(this.effectType) ?? Effect.OCCUPIED;
	}
}

type OutcomeProbabilities = {
	[key in keyof WitchActionOutcomeType]?: number;
}

export type WitchActionFuncs = {
	checkMissions?: CheckMissionsLike,
	generatePotion?: GeneratePotionLike
};

export type CheckMissionsLike = (player: Player, outcome: WitchActionOutcomeType, response: DraftBotPacket[], tags: string[]) => void | Promise<void>;
export type GeneratePotionLike = () => PotionParameters;

export type PotionParameters = {
	minRarity: ItemRarity,
	maxRarity: ItemRarity,
	nature: ItemNature,
}

export class WitchActionDataController extends DataControllerString<WitchAction> {

	static readonly instance = new WitchActionDataController("witch");

	private static witchActionsFunctionsCache: Map<string, WitchActionFuncs>;

	public static getWitchActionFunction(id: string): WitchActionFuncs {
		if (!WitchActionDataController.witchActionsFunctionsCache) {
			WitchActionDataController.witchActionsFunctionsCache = new Map<string, WitchActionFuncs>();
			WitchActionDataController.loadWitchActionsFromFolder("dist/Core/src/core/smallEvents/witch", "../core/smallEvents/witch");
			WitchActionDataController.instance.getValuesArray().forEach((witchAction) => {
				witchAction.checkOutcomeProbabilities();
			});
		}
		return WitchActionDataController.witchActionsFunctionsCache.get(id) ?? {};
	}

	private static loadWitchActionsFromFolder(path: string, relativePath: string): void {
		const files = readdirSync(path);
		for (const file of files) {
			if (file.endsWith(".js")) {
				const defaultFunc = require(`${relativePath}/${file.substring(0, file.length - 3)}`).default;
				const fightActionName = file.substring(0, file.length - 3);
				WitchActionDataController.witchActionsFunctionsCache.set(fightActionName, defaultFunc);
			}
		}
	}

	public getRandomWitchAction(excludedWitchActions: WitchAction[]): WitchAction {
		return RandomUtils.draftbotRandom.pick(Array.from(this.data.values()).filter((witchAction) => !excludedWitchActions.includes(witchAction)));
	}

	newInstance(): WitchAction {
		return new WitchAction();
	}

	getRandomWitchEventByType(isIngredient: boolean): WitchAction {
		return RandomUtils.draftbotRandom.pick(Array.from(this.data.values()).filter((witchAction) => witchAction.isIngredient === isIngredient));
	}

	getDoNothing(): WitchAction {
		return this.getById("doNothing");
	}
}