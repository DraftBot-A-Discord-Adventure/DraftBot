const RepositoryAbstract = require("repositories/RepositoryAbstract");
const Potion = require("entities/Potion");

class PotionRepository extends RepositoryAbstract {

    /**
     * Return an potion by id
     * @param {number} id
     * @return {Promise<Potion>}
     */
    async getById(id) {
        return new Potion(
            id,
            this.text.items.potion[id].rareness,
            this.text.items.potion[id].power,
            this.text.items.potion[id].translations,
            this.text.items.potion[id].nature
        );
    }

    /**
     * Choose a random potion in the existing ones. (take care of the rareness)
     * @return {Promise<Potion>}
     */
    async getRandomWithRareness() {
        const desiredRareness = Tools.generateRandomRareness();
        const possiblePotions = Object.entries(this.text.items.potion).filter(key => parseInt(this.text.items.potion[key[0]].rareness) === desiredRareness);
        const id = possiblePotions[Math.floor(Math.random() * possiblePotions.length)][0];
        return new Potion(
            id,
            this.text.items.potion[id].rareness,
            this.text.items.potion[id].power,
            this.text.items.potion[id].translations,
            this.text.items.potion[id].nature
        );
    }

    /**
     * Choose a potion totally randomly without taking care of the rareness
     * @return {Promise<Potion>}
     */
    async getRandom() {
        const id = Math.round(Math.random() * (Config.raritiesGenerator.numberOfPotion - 1)) + 1;
        return new Potion(
            id,
            this.text.items.potion[id].rareness,
            this.text.items.potion[id].power,
            this.text.items.potion[id].translations,
            this.text.items.potion[id].nature
        );
    }

}

module.exports = PotionRepository;
