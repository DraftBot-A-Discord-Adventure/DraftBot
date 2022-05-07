import Entity, {Entities} from "../models/Entity";
import {TextChannel} from "discord.js";
import {BlockingUtils} from "../utils/BlockingUtils";
import {playerActiveObjects} from "../models/PlayerActiveObjects";
import {Tags} from "../models/Tag";
import Potion from "../models/Potion";
import {MissionsController} from "../missions/MissionsController";
import {countNbOfPotions} from "../utils/ItemUtils";
import {TranslationModule} from "../Translations";

type FighterStats = { fightPoints: number, maxFightPoint: number, speed: number, defense: number, attack: number }

export class Fighter {

	public stats: FighterStats

	private entity: Entity

	private ready: boolean

	private chargingTurn: number

	/**
	 * get the string that mention the user
	 * @public
	 */
	public getMention() {
		return this.entity.getMention();
	}

	/**
	 * the fighter loads its various stats
	 * @param friendly true if the fight is friendly
	 * @public
	 */
	public async prepare(friendly: boolean) {
		const playerActiveObjects: playerActiveObjects = await this.entity.getPlayerActiveObjects();
		this.stats.fightPoints = friendly ? await this.entity.getMaxCumulativeHealth() : await this.entity.getCumulativeHealth();
		this.stats.maxFightPoint = await this.entity.getMaxCumulativeHealth();
		this.stats.attack = await this.entity.getCumulativeAttack(playerActiveObjects);
		this.stats.defense = await this.entity.getCumulativeDefense(playerActiveObjects);
		this.stats.speed = await this.entity.getCumulativeSpeed(playerActiveObjects);
	}

	/**
	 * delete the potion from the inventory of the player if needed
	 * @param friendly true if the fight is friendly
	 * @param channel
	 * @param language
	 * @public
	 */
	public async consumePotionIfNeeded(friendly: boolean, channel: TextChannel, language: string) {
		if (friendly || !await this.currentPotionIsAFightPotion()) {
			return;
		}
		const tagsToVerify = await Tags.findTagsFromObject((await this.entity.Player.getMainPotionSlot().getItem()).id, Potion.name);
		if (tagsToVerify) {
			for (let i = 0; i < tagsToVerify.length; i++) {
				await MissionsController.update(this.entity.discordUserId, channel, language, tagsToVerify[i].textTag, 1, {tags: tagsToVerify});
			}
		}
		await this.entity.Player.drinkPotion();
		await MissionsController.update(this.entity.discordUserId, channel, language, "drinkPotion");
		[this.entity] = await Entities.getOrRegister(this.entity.discordUserId);
		await MissionsController.update(this.entity.discordUserId, channel, language, "havePotions", countNbOfPotions(this.entity.Player), null, true);
	}

	/**
	 * Allow a fighter to block itself
	 * @public
	 */
	public block() {
		BlockingUtils.blockPlayer(this.entity.discordUserId, "fight");
	}

	/**
	 * return false if the user does not need to charge its energy
	 * charge the energy if needed
	 * @public
	 */
	public chargeEnergy(): boolean {
		if (this.chargingTurn === 0) {
			this.chargingTurn--;
			return true;
		}
		return false;
	}

	/**
	 * check if the potion of the fighter is a fight potion
	 * @private
	 */
	private async currentPotionIsAFightPotion() {
		return (await this.entity.Player.getMainPotionSlot().getItem() as Potion).isFightPotion();
	}

	/**
	 * Return a display of the player in a string format
	 * @param fightTranslationModule
	 */
	public async getStringDisplay(fightTranslationModule: TranslationModule): Promise<string> {
		return fightTranslationModule.format("summarize.attacker", {
			pseudo: await this.entity.Player.getPseudo(fightTranslationModule.language),
			charging: this.chargingTurn > 0 ? fightTranslationModule.get("actions.chargingEmote") : ""
		}) +
			fightTranslationModule.format("summarize.stats", {
				power: this.stats.fightPoints,
				attack: this.stats.attack,
				defense: this.stats.defense,
				speed: this.stats.speed
			});
	}

	/**
	 * execute one turn
	 */
	public play() {
		console.log("im playing");
	}
}

