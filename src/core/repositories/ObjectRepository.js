//
// /**
//  * Choose a random object in the existing ones. (take care of the rarity)
//  * @return {Promise<Object>}
//  */
// async getRandomWithRarity() {
//     const desiredRarity = generateRandomRarity();
//     const possibleObjects = Object.entries(this.objects).filter(key => this.object[key[0]].rarity === desiredRarity);
//     const id = possibleObjects[Math.floor(Math.random() * possibleObjects.length)][0];
//     return this.objects[id];
// }
