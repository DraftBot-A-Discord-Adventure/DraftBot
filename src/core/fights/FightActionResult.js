/**
 * @param {Number} damage
 * @param {Number} defenseImprovement
 * @param {Number} speedImprovement
 * @param {Boolean} fullSuccess
 */
class FightActionResult {
	constructor() {
		this.damage = 0;
		this.ownDamage = 0;
		this.speedImprovement = 0;
		this.fullSuccess = false;
	}
}

module.exports = FightActionResult;