module.exports = (sequelize, DataTypes) => {

    const Guilds = sequelize.define('Guilds', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(32)
        },
        score: {
            type: DataTypes.INTEGER,
            defaultValue: JsonReader.models.guilds.score
        },
        level: {
            type: DataTypes.INTEGER,
            defaultValue: JsonReader.models.guilds.level
        },
        experience: {
            type: DataTypes.INTEGER,
            defaultValue: JsonReader.models.guilds.experience
        },
        lastDailyAt: {
            type: DataTypes.DATE,
            defaultValue: JsonReader.models.guilds.lastDailyAt
        },
        chief_id: {
            type: DataTypes.INTEGER
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: require('moment')().format('YYYY-MM-DD HH:mm:ss')
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: require('moment')().format('YYYY-MM-DD HH:mm:ss')
        }
    }, {
        tableName: 'guilds',
        freezeTableName: true
    });

    Guilds.beforeSave((instance, options) => {
        instance.setDataValue('updatedAt', require('moment')().format('YYYY-MM-DD HH:mm:ss'));
    });


    /**
     * @param {Number} id
     */
    Guilds.getById = (id) => {
        return Guilds.findOne({
            where: {
                id: id
            },
        });
    };

    /**
     * @param {String} name
     y*/
    Guilds.getByName = (name) => {
        return Guilds.findOne({
            where: {
                name: name
            },
        });
    };

    /**
     * @return {Number} Return the experience needed to level up.
     */
    Guilds.prototype.getExperienceNeededToLevelUp = function () {
        return JsonReader.models.guilds.xp[this.level + 1];
    };

    /**
     * @returns {Number} Return the experience used to level up.
     */
    Guilds.prototype.getExperienceUsedToLevelUp = function () {
        return JsonReader.models.guilds.xp[this.level];
    };

    /**
     * @param {Number} score
     */
    Guilds.prototype.addExperience = function (experience) {
        this.experience += experience;
        this.setExperience(this.experience);
    };

    /**
     * @param {Number} score
     */
    Guilds.prototype.setExperience = function (experience) {
        if (experience > 0) {
            this.experience = experience;
        } else {
            this.experience = 0;
        }
    };

    return Guilds;
};