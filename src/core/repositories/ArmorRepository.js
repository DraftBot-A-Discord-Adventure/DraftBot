    /**
     * Return an armor by id
     * @param {Number} id
     * @return {Promise<Armor>}
     */
    async getById(id) {
        return this.armors[id];
    }

    /**
     * Choose a random armor in the existing ones. (take care of the rarity)
     * @return {Promise<Armor>}
     */
    async getRandomWithRarity() {
        const desiredRarity = generateRandomRarity();
        const possibleArmors = Object.entries(this.armors).filter(key => this.armors[key[0]].rarity === desiredRarity);
        const id = possibleArmors[Math.floor(Math.random() * possibleArmors.length)][0];
        return this.armors[id];
    }
