import {Tags} from "../models/Tag";
import Potion from "../models/Potion";
import {MissionsController} from "../missions/MissionsController";
import {countNbOfPotions} from "../utils/ItemUtils";
import {Entities} from "../models/Entity";

/**
 * @param entity
 * @param {boolean} friendly
 */
class Fighter {

	/**
	 * @param entity
	 * @param {boolean} friendly
	 */
	constructor(entity, friendly) {
		this.friendly = friendly;
		this.entity = entity;
		this.attacksList = {};
		this.quickAttack = -1;
	}

	/**
	 * Calculate all the stats of a fighter. Must be done outside of the constructor because of asynchronicity
	 * @return {Promise<void>}
	 */
	async calculateStats() {
		const w = await this.entity.Player.getMainWeaponSlot().getItem();
		const a = await this.entity.Player.getMainArmorSlot().getItem();
		const p = await this.entity.Player.getMainPotionSlot().getItem();
		if (this.friendly) {
			p.power = 0;
		}
		const power = this.friendly ? await this.entity.getMaxCumulativeHealth() : await this.entity.getCumulativeHealth();
		const o = await this.entity.Player.getMainObjectSlot().getItem();
		this.attack = await this.entity.getCumulativeAttack(w, a, p, o);
		this.defense = await this.entity.getCumulativeDefense(w, a, p, o);
		this.speed = await this.entity.getCumulativeSpeed(w, a, p, o);
		this.power = power;
		this.initialPower = this.power;
		this.maxSpeedImprovement = FIGHT.MAX_SPEED_IMPROVEMENT;
		this.chargeTurns = -1;
		this.chargeAct = null;
	}

	/**
	 * Drink the potion if it is a fight potion
	 */
	async consumePotionIfNeeded(message, language) {
		if (!this.friendly) {
			if ((await this.entity.Player.getMainPotionSlot().getItem()).isFightPotion()) {
				await this.entity.Player.drinkPotion();
				[this.entity] = await Entities.getOrRegister(this.entity.discordUserId);
				await MissionsController.update(this.entity.discordUserId, message.channel, language, "havePotions",countNbOfPotions(this.entity.Player),null,true);
				const tagsToVerify = await Tags.findTagsFromObject((await this.entity.Player.getMainPotionSlot().getItem()).id, Potion.name);
				if (tagsToVerify) {
					for (let i = 0; i < tagsToVerify.length; i++) {
						await MissionsController.update(this.entity.discordUserId, message.channel, language, tagsToVerify[i].textTag, 1, {tags: tagsToVerify});
					}
				}
			}
		}
	}

	/**
	 * Improve speed of the fighter and update max improvement
	 * @return {number} Added speed
	 */
	improveSpeed() {
		this.maxSpeedImprovement += randInt(0, Math.round(this.maxSpeedImprovement / 2));
		this.speed += this.maxSpeedImprovement;
		const r = this.maxSpeedImprovement;
		this.maxSpeedImprovement = Math.floor(this.maxSpeedImprovement * 0.5);
		return r;
	}

	/**
	 * Make a player charge an action for a certain number of turns
	 * @param {FIGHT.ACTION} action
	 * @param {number} turns
	 */
	chargeAction(action, turns) {
		this.chargeTurns = turns;
		this.chargeAct = action;
	}
}

module.exports = Fighter;