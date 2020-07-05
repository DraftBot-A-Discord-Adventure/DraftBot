//
// /**
//  * Choose a random potion in the existing ones. (take care of the rarity)
//  * @return {Promise<Potion>}
//  */
// async getRandomWithRarity() {
//     const desiredRarity = generateRandomRarity();
//     const possiblePotions = Object.entries(this.potions).filter(key => this.potions[key[0]].rarity === desiredRarity);
//     const id = possiblePotions[Math.floor(Math.random() * possiblePotions.length)][0];
//     return this.potions[id];
// }
