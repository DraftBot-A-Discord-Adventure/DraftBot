const RepositoryAbstract = require("repositories/RepositoryAbstract");
const Weapon = require("entities/Weapon");

class WeaponRepository extends RepositoryAbstract {

    /**
     * Return default weapon
     * @return {Promise<Weapon>}
     */
    async getDefaultWeapon() {
        return new Weapon(
            "default",
            this.text.items.weapon.default.rareness,
            this.text.items.weapon.default.power,
            this.text.items.weapon.default.translations,
            this.text.items.effect[this.text.items.weapon.default.rareness][this.text.items.weapon.default.power]
        );
    }

    /**
     * Return a weapon by id
     * @param {number} id
     * @return {Promise<Weapon>}
     */
    async getWeaponById(id) {
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
    async getRandomWeaponWithRareness() {
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
    async getRandomWeapon() {
        const id = Math.round(Math.random() * (Config.raritiesGenerator.numberOfWeapon - 1)) + 1; // TODO Config.raritiesGenerator.numberOfWeapon peut etre remplacé par length - 1 du nbr d'armor ?
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
