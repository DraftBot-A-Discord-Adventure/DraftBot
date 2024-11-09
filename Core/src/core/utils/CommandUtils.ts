import Player from "../database/game/models/Player";
import {DraftBotPacket, makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {Effect} from "../../../../Lib/src/enums/Effect";
import {Right} from "../../../../Lib/src/enums/Right";
import {RequirementEffectPacket} from "../../../../Lib/src/packets/commands/requirements/RequirementEffectPacket";
import {RequirementLevelPacket} from "../../../../Lib/src/packets/commands/requirements/RequirementLevelPacket";
import {GuildRole} from "../../../../Lib/src/enums/GuildRole";
import {Guilds} from "../database/game/models/Guild";
import {RequirementGuildNeededPacket} from "../../../../Lib/src/packets/commands/requirements/RequirementGuildNeededPacket";
import {RequirementGuildRolePacket} from "../../../../Lib/src/packets/commands/requirements/RequirementGuildRolePacket";
import {RequirementRightPacket} from "../../../../Lib/src/packets/commands/requirements/RequirementRightPacket";

export abstract class CommandUtils {
	/**
	 * Check if the player has the required effects
	 * @param player
	 * @param response
	 * @param allowedEffects
	 * @param disallowedEffects
	 */
	static checkEffects(player: Player, response: DraftBotPacket[], allowedEffects: Effect[], disallowedEffects: Effect[]): boolean {
		const playerEffect = Effect.getById(player.effectId);

		if (disallowedEffects.includes(playerEffect)) {
			response.push(makePacket(RequirementEffectPacket, {
				currentEffectId: player.effectId,
				remainingTime: player.effectRemainingTime()
			}));
			return false;
		}

		if (!allowedEffects.includes(playerEffect)) {
			response.push(makePacket(RequirementEffectPacket, {
				currentEffectId: player.effectId,
				remainingTime: player.effectRemainingTime()
			}));
			return false;
		}

		return true;
	}

	/**
	 * Verify if the player is in a guild and has the required role
	 * @param player
	 * @param response
	 * @param guildRoleNeeded
	 */
	static async verifyGuildRequirements(player: Player, response: DraftBotPacket[], guildRoleNeeded: GuildRole): Promise<boolean> {
		let guild;
		try {
			guild = await Guilds.getById(player.guildId);
		}
		catch (error) {
			guild = null;
		}

		if (!guild) {
			response.push(makePacket(RequirementGuildNeededPacket, {}));
			return false;
		}

		let playerRole = GuildRole.MEMBER;
		if (player.id === guild.getElderId()) {
			playerRole = GuildRole.ELDER;
		}
		if (player.id === guild.getChiefId()) {
			playerRole = GuildRole.CHIEF;
		}

		if (guildRoleNeeded && playerRole < guildRoleNeeded) {
			response.push(makePacket(RequirementGuildRolePacket, {
				roleNeeded: guildRoleNeeded
			}));
			return false;
		}

		return true;
	}

	/**
	 * Verify if the player can execute a command based on the given requirements
	 * @param player
	 * @param context
	 * @param response
	 * @param requirements
	 */
	static async verifyCommandRequirements(player: Player, context: PacketContext, response: DraftBotPacket[], requirements: {
		disallowedEffects?: Effect[];
		allowedEffects?: Effect[];
		level?: number;
		right?: Right;
		guildNeeded?: boolean;
		guildRoleNeeded?: GuildRole;
	}): Promise<boolean> {
		if (!CommandUtils.checkEffects(player, response, requirements.allowedEffects ?? [], requirements.disallowedEffects ?? [])) {
			return false;
		}

		if (requirements.level && player.level < requirements.level) {
			response.push(makePacket(RequirementLevelPacket, {
				requiredLevel: requirements.level
			}));
			return false;
		}

		if (requirements.right && !context.rights.includes(requirements.right)) {
			response.push(makePacket(RequirementRightPacket, {}));
			return false;
		}

		if (requirements.guildNeeded || requirements.guildRoleNeeded) {
			if (!await CommandUtils.verifyGuildRequirements(player, response, requirements.guildRoleNeeded)) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Verify if the player is started and not dead
	 * @param player
	 * @param response
	 */
	static verifyStartedAndNotDead(player: Player, response: DraftBotPacket[]): Promise<boolean> {
		return CommandUtils.verifyCommandRequirements(player, {}, response, {
			disallowedEffects: [Effect.NOT_STARTED, Effect.DEAD]
		});
	}

	/**
	 * Verify if the player has no effect
	 * @param player
	 * @param response
	 */
	static verifyNoEffect(player: Player, response: DraftBotPacket[]): Promise<boolean> {
		return CommandUtils.verifyCommandRequirements(player, {}, response, {
			allowedEffects: [Effect.NO_EFFECT]
		});
	}

	/**
	 * Verify if the player has started to play the game
	 * @param player
	 * @param response
	 */
	static verifyStarted(player: Player, response: DraftBotPacket[]): Promise<boolean> {
		return CommandUtils.verifyCommandRequirements(player, {}, response, {
			disallowedEffects: [Effect.NOT_STARTED]
		});
	}

	/**
	 * Verify if the player is not dead (but can be not started)
	 */
	static verifyNotDead(player: Player, response: DraftBotPacket[]): Promise<boolean> {
		return CommandUtils.verifyCommandRequirements(player, {}, response, {
			disallowedEffects: [Effect.DEAD]
		});
	}
}