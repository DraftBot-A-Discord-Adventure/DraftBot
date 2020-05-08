const EntityAbstract = require('entities/EntityAbstract');

/**
 * @property {String} playerId
 * @property {Number} weaponId
 * @property {Number} armorId
 * @property {Number} potionId
 * @property {Number} objectId
 * @property {Number} backupItemId
 * @property {Number} lastDaily
 */
class Inventory extends EntityAbstract {

  /**
   * @param {String} playerId
   * @param {Number} weaponId
   * @param {Number} armorId
   * @param {Number} potionId
   * @param {Number} objectId
   * @param {Number} backupItemId
   * @param {Number} lastDaily
   */
  constructor({playerId, weaponId, armorId, potionId, objectId, backupItemId, lastDaily}) {
    super();
    this.playerId = playerId;
    this.weaponId = weaponId;
    this.armorId = armorId;
    this.potionId = potionId;
    this.objectId = objectId;
    this.backupItemId = backupItemId;
    this.lastDaily = lastDaily;
  }

  /**
   * Returns the inventory as embed list
   * @param {("fr"|"en")} language - The language the inventory has to be displayed in
   * @returns {[string|{String}]}
   */
  async toEmbedObject(language) {
    let result = {
      title: format(
          JsonReader.models.inventories.getTranslation(language).title, {
            pseudo: (await getRepository('player')
                .getByIdOrCreate(this.playerId)).getPseudo(language),
          }),
      fields: [],
    };

    result.fields.push(
        (await getRepository('weapon').getById(this.weaponId)).toFieldObject(
            language));

    result.fields.push(
        (await getRepository('armor').getById(this.armorId)).toFieldObject(
            language));

    result.fields.push(
        (await getRepository('potion').getById(this.potionId)).toFieldObject(
            language));

    result.fields.push(
        (await getRepository('object').getById(this.objectId)).toFieldObject(
            language, 'active'));

    result.fields.push(
        (await getRepository('object').getById(this.backupItemId)).toFieldObject(
            language, 'backup'));

    return result;
  }

}

module.exports = Inventory;
