/**
 * @param entity
 * @param {boolean} friendly
 * @param {boolean} tournament
 */
class Fighter {

	/**
	 * @param entity
	 * @param {boolean} friendly
	 * @param {boolean} tournament
	 */
	constructor(entity, friendly, tournament) {
		this.friendly = friendly;
		this.tournament = tournament;
		this.entity = entity;
		this.attacksList = {};
		this.quickAttack = -1;
	}

	/**
	 * Calculate all the stats of a fighter. Must be done outside of the constructor because of asynchronicity
	 * @return {Promise<void>}
	 */
	async calculateStats() {
		const inv = this.entity.Player.Inventory;
		const w = await inv.getWeapon();
		const a = await inv.getArmor();
		const p = await inv.getPotion();
		if (this.friendly) {
			p.power = 0;
		}
		const o = await inv.getActiveObject();
		this.attack = await this.entity.getCumulativeAttack(w, a, p, o);
		this.defense = await this.entity.getCumulativeDefense(w, a, p, o);
		this.speed = await this.entity.getCumulativeSpeed(w, a, p, o);
		this.power = (this.friendly || this.tournament) ? await this.entity.getMaxCumulativeHealth() : await this.entity.getCumulativeHealth();
		this.initialPower = this.power;
		this.maxSpeedImprovement = FIGHT.MAX_SPEED_IMPROVEMENT;
		this.chargeTurns = -1;
		this.chargeAct = null;
	}

	/**
	 * Drink the potion if it is a fight potion
	 */
	async consumePotionIfNeeded() {
		if (!this.friendly) {
			if ((await this.entity.Player.Inventory.getPotion()).isFightPotion()) {
				this.entity.Player.Inventory.drinkPotion();
				this.entity.Player.Inventory.save();
				this.entity.Player.save();
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