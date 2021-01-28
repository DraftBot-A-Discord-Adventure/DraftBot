const fs = require("fs");

/**
 * @class
 */
class Attack {

	/**
	 * @return {Promise<void>}
	 */
	static async init() {
		Attack.attacks = new Map();
		const attacksFiles = await fs.promises.readdir("src/core/fights/attacks");
		for (const attackFile of attacksFiles) {
			if (!attackFile.endsWith(".js")) continue;
			const attackName = attackFile.split(".")[0];
			const attacks = require(`${folder}/${attackName}`).attacks;
			if (attacks !== undefined) {
				for (let i = 0; i < attacks.length; ++i) {
					attack.attacks.set(attacks[i].name, attacks[i].func);
				}
			}
		}
	}

	/**
	 * @param {String} attack - The attack to get
	 * @return An instance of the attack asked
	 */
	static getAttack(attack) {
		return attack.attacks.get(attack);
	}

}

/**
 * @type {{init: attack.init}}
 */
module.exports = {
	init: Attack.init,
};

global.getAttack = Attack.getAttack;

