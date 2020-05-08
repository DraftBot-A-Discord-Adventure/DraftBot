module.exports = (sequelize, DataTypes) => {

  const Entities = sequelize.define('Entities', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    maxHealth: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.entities.maxHealth
    },
    health: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.entities.health
    },
    attack: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.entities.attack
    },
    defense: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.entities.defense
    },
    speed: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.entities.speed
    },
    effect: {
      type: DataTypes.STRING(32),
      defaultValue: JsonReader.models.entities.effect
    },
    discordUser_id: {
      type: DataTypes.STRING(64)
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'entities',
    freezeTableName: true
  });

  return Entities;
};
