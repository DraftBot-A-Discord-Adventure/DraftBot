const RepositoryAbstract = require("repositories/RepositoryAbstract");
const Weapon = require("entities/Weapon");

class WeaponRepository extends RepositoryAbstract {

    /**
     * Return a weapon by id
     * @param {number|String} id
     * @return {Promise<Weapon>}
     */
    async getById(id) {
        return new Weapon(
            id,
            this.text.items.weapon[id].rareness,
            this.text.items.weapon[id].power,
            this.text.items.weapon[id].translations,
            this.text.items.effect[this.text.items.weapon[id].rareness][this.text.items.weapon[id].power]
        );
    }

    /**
     * Choose a random weapon in the existing ones. (take care of the rareness)
     * @return {Promise<Weapon>}
     */
    async getRandomWithRareness() {
        const desiredRareness = Tools.generateRandomRareness();
        const possibleWeapons = Object.entries(this.text.items.weapon).filter(key => parseInt(this.text.items.weapon[key[0]].rareness) === desiredRareness);
        const id = possibleWeapons[Math.floor(Math.random() * possibleWeapons.length)][0];
        return new Weapon(
            id,
            this.text.items.weapon[id].rareness,
            this.text.items.weapon[id].power,
            this.text.items.weapon[id].translations,
            this.text.items.effect[this.text.items.weapon[id].rareness][this.text.items.weapon[id].power]
        );
    }


    /**
     * Choose a weapon totally randomly without taking care of the rareness
     * @return {Promise<Weapon>}
     */
    async getRandom() {
        const id = Math.round(Math.random() * (Config.raritiesGenerator.numberOfWeapon - 1)) + 1;
        return new Weapon(
            id,
            this.text.items.weapon[id].rareness,
            this.text.items.weapon[id].power,
            this.text.items.weapon[id].translations,
            this.text.items.effect[this.text.items.weapon[id].rareness][this.text.items.weapon[id].power]
        );
    }

}

module.exports = WeaponRepository;
