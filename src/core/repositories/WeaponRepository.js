//
//
// /**
//  * Choose a random weapon in the existing ones. (take care of the rarity)
//  * @return {Promise<Weapon>}
//  */
// async getRandomWithRarity() {
//     const desiredRarity = generateRandomRarity();
//     const possibleWeapons = Object.entries(this.weapons).filter(key => this.weapons[key[0]].rarity === desiredRarity);
//     const id = possibleWeapons[Math.floor(Math.random() * possibleWeapons.length)][0];
//     return this.weapons[id];
// }
