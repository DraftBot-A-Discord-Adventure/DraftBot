import {DataTypes, Model, Sequelize} from "sequelize";
import * as moment from "moment";
import {Constants} from "../../../Constants";
import {RandomUtils} from "../../../utils/RandomUtils";
import {PVEConstants} from "../../../constants/PVEConstants";

export class Monster extends Model {
	declare readonly id: string;

	declare readonly fr: string;

	declare readonly en: string;

	declare readonly descriptionFr: string;

	declare readonly descriptionEn: string;

	declare readonly emoji: string;

	declare readonly fightPointsRatio: number;

	declare readonly attackRatio: number;

	declare readonly defenseRatio: number;

	declare readonly speedRatio: number;

	declare readonly breath: number;

	declare readonly maxBreath: number;

	declare readonly breathRegen: number;

	declare updatedAt: Date;

	declare createdAt: Date;


	public getName(language: string): string {
		return language === Constants.LANGUAGE.FRENCH ? this.fr : this.en;
	}

	/**
	 * Get the rewards of the monster
	 * @param level Monster's level
	 */
	public getRewards(level: number): {
		money: number,
		xp: number,
		guildScore: number,
		guildXp: number
	} {
		let totalRatio = (this.fightPointsRatio + this.attackRatio + this.defenseRatio + this.speedRatio) / 10.0;
		totalRatio = RandomUtils.draftbotRandom.real(totalRatio * (1 - PVEConstants.FIGHT_REWARDS.TOTAL_RATIO_RANDOM_RANGE), totalRatio * (1 + PVEConstants.FIGHT_REWARDS.TOTAL_RATIO_RANDOM_RANGE));
		const rewardMultiplier = PVEConstants.FIGHT_REWARDS.LEVEL_MULTIPLIER.A * level + PVEConstants.FIGHT_REWARDS.LEVEL_MULTIPLIER.B;

		return {
			money: Math.round((PVEConstants.FIGHT_REWARDS.MONEY.A * totalRatio * totalRatio + PVEConstants.FIGHT_REWARDS.MONEY.B * totalRatio + PVEConstants.FIGHT_REWARDS.MONEY.C) * rewardMultiplier),
			xp: Math.round((PVEConstants.FIGHT_REWARDS.XP.A * totalRatio * totalRatio + PVEConstants.FIGHT_REWARDS.XP.B * totalRatio + PVEConstants.FIGHT_REWARDS.XP.C) * rewardMultiplier),
			guildScore: Math.round(PVEConstants.FIGHT_REWARDS.GUILD_SCORE_MULTIPLIER * totalRatio),
			guildXp: Math.round((PVEConstants.FIGHT_REWARDS.GUILD_XP.A * totalRatio * totalRatio + PVEConstants.FIGHT_REWARDS.GUILD_XP.B * totalRatio + PVEConstants.FIGHT_REWARDS.GUILD_XP.C)
				* rewardMultiplier)
		};
	}

	/**
	 * Get the description of the monster
	 * @param language
	 */
	getDescription(language: string): string {
		return language === Constants.LANGUAGE.FRENCH ? this.descriptionFr : this.descriptionEn;
	}

	/**
	 * Get the emoji of the monster
	 */
	getEmoji(): string {
		return this.emoji;
	}
}

export function initModel(sequelize: Sequelize): void {
	Monster.init({
		id: {
			// eslint-disable-next-line new-cap
			type: DataTypes.STRING(64),
			primaryKey: true
		},
		fr: {
			// eslint-disable-next-line new-cap
			type: DataTypes.STRING(64),
			allowNull: false
		},
		en: {
			// eslint-disable-next-line new-cap
			type: DataTypes.STRING(64),
			allowNull: false
		},
		descriptionFr: {
			// eslint-disable-next-line new-cap
			type: DataTypes.STRING(512),
			allowNull: false
		},
		descriptionEn: {
			// eslint-disable-next-line new-cap
			type: DataTypes.STRING(512),
			allowNull: false
		},
		emoji: {
			// eslint-disable-next-line new-cap
			type: DataTypes.STRING(10),
			allowNull: false
		},
		fightPointsRatio: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		attackRatio: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		defenseRatio: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		speedRatio: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		breath: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		maxBreath: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		breathRegen: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		updatedAt: {
			type: DataTypes.DATE,
			defaultValue: moment().format("YYYY-MM-DD HH:mm:ss")
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: moment().format("YYYY-MM-DD HH:mm:ss")
		}
	}, {
		sequelize,
		tableName: "monsters",
		freezeTableName: true
	});

	Monster.beforeSave(instance => {
		instance.updatedAt = moment().toDate();
	});
}

export default Monster;