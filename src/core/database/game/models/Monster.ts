import {DataTypes, Model, Sequelize} from "sequelize";
import * as moment from "moment";
import {Constants} from "../../../Constants";
import {RandomUtils} from "../../../utils/RandomUtils";
import {PVEConstants} from "../../../constants/PVEConstants";

export class Monster extends Model {
	public readonly id!: string;

	public readonly fr!: string;

	public readonly en!: string;

	public readonly descriptionFr!: string;

	public readonly descriptionEn!: string;

	private readonly emoji: string;

	public readonly fightPointsRatio!: number;

	public readonly attackRatio!: number;

	public readonly defenseRatio!: number;

	public readonly speedRatio!: number;

	public readonly breath!: number;

	public readonly maxBreath!: number;

	public readonly breathRegen!: number;

	public updatedAt!: Date;

	public createdAt!: Date;


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
		guildScore: number
	} {
		let totalRatio = (this.fightPointsRatio + this.attackRatio + this.defenseRatio + this.speedRatio) / 10.0;
		totalRatio = RandomUtils.draftbotRandom.real(totalRatio * (1 - PVEConstants.FIGHT_REWARDS.TOTAL_RATIO_RANDOM_RANGE), totalRatio * (1 + PVEConstants.FIGHT_REWARDS.TOTAL_RATIO_RANDOM_RANGE));
		const rewardMultiplier = PVEConstants.FIGHT_REWARDS.LEVEL_MULTIPLIER.A * level + PVEConstants.FIGHT_REWARDS.LEVEL_MULTIPLIER.B;

		return {
			money: Math.round((PVEConstants.FIGHT_REWARDS.MONEY.A * totalRatio * totalRatio + PVEConstants.FIGHT_REWARDS.MONEY.B * totalRatio + PVEConstants.FIGHT_REWARDS.MONEY.C) * rewardMultiplier),
			xp: Math.round((PVEConstants.FIGHT_REWARDS.XP.A * totalRatio * totalRatio + PVEConstants.FIGHT_REWARDS.XP.B * totalRatio + PVEConstants.FIGHT_REWARDS.XP.C) * rewardMultiplier),
			guildScore: Math.round(PVEConstants.FIGHT_REWARDS.GUILD_SCORE_MULTIPLIER * totalRatio)
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
	getEmoji() {
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