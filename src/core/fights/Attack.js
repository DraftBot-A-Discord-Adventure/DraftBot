// const fs = require("fs");

/**
 * @class
 */
class Attack {

	/**
	 * @return {Promise<void>}
	 */
	static /* async*/ init() {
		Attack.attacks = new Map();
		/* const attacksFiles = await fs.promises.readdir("src/core/fights/attacks");
		for (const attackFile of attacksFiles) {
			if (!attackFile.endsWith(".js")) continue;
			const attackName = attackFile.split(".")[0];
			const attacks = require(`attacks/${attackName}`).attacks;
			if (attacks !== undefined) {
				for (let i = 0; i < attacks.length; ++i) {
					Attack.attacks.set(attacks[i].actionNumber, attacks[i].func);
				}
			}
		}*/
	}

	/**
	 * @return An instance of the attack asked
	 * @param {Number} attackNumber
	 */
	static getAttack(attackNumber) {
		return Attack.attacks.get(attackNumber);
	}

}

/**
 * @type {{init: attack.init}}
 */
module.exports = {
	init: Attack.init
};

global.getAttack = Attack.getAttack;

