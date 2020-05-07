module.exports = (sequelize, DataTypes) => {

    const Guild = sequelize.define('Guild', {
        guildId: {
            type: DataTypes.STRING(64),
            primaryKey: true,
            autoIncrement: false
        },
        name: {
            type: DataTypes.STRING(20),
            defaultValue: JsonReader.entities.player.name
        },
        chiefId: {
            type: DataTypes.STRING(64),
            defaultValue: JsonReader.entities.player.chiefId
        },
        score: {
            type: DataTypes.INT,
            defaultValue: JsonReader.entities.player.score
        },
        level: {
            type: DataTypes.INT,
            defaultValue: JsonReader.entities.player.level
        },
        experience: {
            type: DataTypes.INT,
            defaultValue: JsonReader.entities.player.experience
        },
        lastInvocation: {
            type: DataTypes.INT,
            defaultValue: JsonReader.entities.player.lastInvocation
        },
    }, {
        tableName: 'guild',
        freezeTableName: true,
        timestamps: false
    });

    /**
     * @return {string}
     */
    Guild.prototype.echo = function () {
        return `ID: ${this.guildid}, NAME: ${this.name}, CHIEF: ${this.chiefId}, SCORE: ${this.score}, LEVEL: ${this.level}, EXPERIENCE: ${this.experience}, LAST INVOCATION: ${this.lastInvocation}`.green;
    };

    return Guild;
};
