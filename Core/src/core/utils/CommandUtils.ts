import Player, {Players} from "../database/game/models/Player";
import {DraftBotPacket, makePacket, PacketContext, PacketLike} from "../../../../Lib/src/packets/DraftBotPacket";
import {Effect} from "../../../../Lib/src/types/Effect";
import {RightGroup} from "../../../../Lib/src/types/RightGroup";
import {RequirementEffectPacket} from "../../../../Lib/src/packets/commands/requirements/RequirementEffectPacket";
import {RequirementLevelPacket} from "../../../../Lib/src/packets/commands/requirements/RequirementLevelPacket";
import {GuildRole} from "../../../../Lib/src/types/GuildRole";
import {Guilds} from "../database/game/models/Guild";
import {RequirementGuildNeededPacket} from "../../../../Lib/src/packets/commands/requirements/RequirementGuildNeededPacket";
import {RequirementGuildRolePacket} from "../../../../Lib/src/packets/commands/requirements/RequirementGuildRolePacket";
import {RequirementRightPacket} from "../../../../Lib/src/packets/commands/requirements/RequirementRightPacket";
import {BlockingUtils} from "./BlockingUtils";
import {draftBotInstance} from "../../index";
import {ErrorBannedPacket} from "../../../../Lib/src/packets/commands/ErrorPacket";

type Requirements = {
	disallowedEffects?: Effect[];
	allowedEffects?: Effect[];
	level?: number;
	rightGroup?: RightGroup;
	guildNeeded?: boolean;
	guildRoleNeeded?: GuildRole;
	notBlocked: boolean;
};

type RequirementsWithoutBlocked = Omit<Requirements, "notBlocked">;

export abstract class CommandUtils {
	static readonly DISALLOWED_EFFECTS = {
		DEAD: [Effect.DEAD],
		NOT_STARTED: [Effect.NOT_STARTED],
		NOT_STARTED_OR_DEAD: [Effect.NOT_STARTED, Effect.DEAD],
		NOT_STARTED_OR_DEAD_OR_JAILED: [Effect.NOT_STARTED, Effect.DEAD, Effect.JAILED]
	};

	static readonly ALLOWED_EFFECTS = {
		NO_EFFECT: [Effect.NO_EFFECT]
	};

	/**
	 * Check if the player has the required effects
	 * @param player
	 * @param response
	 * @param allowedEffects
	 * @param disallowedEffects
	 */
	static checkEffects(player: Player, response: DraftBotPacket[], allowedEffects: Effect[], disallowedEffects: Effect[]): boolean {
		const playerEffect = player.effectId === Effect.NOT_STARTED.id || player.effectRemainingTime() > 0 ? Effect.getById(player.effectId) : Effect.NO_EFFECT;

		if (disallowedEffects.includes(playerEffect)) {
			response.push(makePacket(RequirementEffectPacket, {
				currentEffectId: player.effectId,
				remainingTime: player.effectRemainingTime()
			}));
			return false;
		}

		if (allowedEffects.length !== 0 && !allowedEffects.includes(playerEffect)) {
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
		catch {
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
	static async verifyCommandRequirements(player: Player, context: PacketContext, response: DraftBotPacket[], requirements: RequirementsWithoutBlocked): Promise<boolean> {
		if (!CommandUtils.checkEffects(player, response, requirements.allowedEffects ?? [], requirements.disallowedEffects ?? [])) {
			return false;
		}

		if (requirements.level && player.level < requirements.level) {
			response.push(makePacket(RequirementLevelPacket, {
				requiredLevel: requirements.level
			}));
			return false;
		}

		if (requirements.rightGroup && !context.rightGroups.includes(requirements.rightGroup)) {
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
		return CommandUtils.verifyCommandRequirements(player, { frontEndOrigin: "", frontEndSubOrigin: "" }, response, {
			disallowedEffects: [Effect.NOT_STARTED, Effect.DEAD]
		});
	}

	/**
	 * Verify if the player has no effect
	 * @param player
	 * @param response
	 */
	static verifyNoEffect(player: Player, response: DraftBotPacket[]): Promise<boolean> {
		return CommandUtils.verifyCommandRequirements(player, { frontEndOrigin: "", frontEndSubOrigin: "" }, response, {
			allowedEffects: [Effect.NO_EFFECT]
		});
	}

	/**
	 * Verify if the player has started to play the game
	 * @param player
	 * @param response
	 */
	static verifyStarted(player: Player, response: DraftBotPacket[]): Promise<boolean> {
		return CommandUtils.verifyCommandRequirements(player, { frontEndOrigin: "", frontEndSubOrigin: "" }, response, {
			disallowedEffects: [Effect.NOT_STARTED]
		});
	}

	/**
	 * Verify if the player is not dead (but can be not started)
	 */
	static verifyNotDead(player: Player, response: DraftBotPacket[]): Promise<boolean> {
		return CommandUtils.verifyCommandRequirements(player, { frontEndOrigin: "", frontEndSubOrigin: "" }, response, {
			disallowedEffects: [Effect.DEAD]
		});
	}
}

type WithPlayerPacketListenerCallbackServer<T extends DraftBotPacket> = (response: DraftBotPacket[], player: Player, packet: T, context: PacketContext) => void | Promise<void>;

/**
 * Core command decorator to register a command handler with its requirements
 * @param packet
 * @param requirements
 */
export const commandRequires = <T extends DraftBotPacket>(packet: PacketLike<T>, requirements: Requirements) =>
	(target: unknown, prop: string, descriptor: TypedPropertyDescriptor<WithPlayerPacketListenerCallbackServer<T>>): void => {
		draftBotInstance.packetListener.addPacketListener<T>(packet, async (response: DraftBotPacket[], context: PacketContext, packet: T): Promise<void> => {
			const player = await Players.getOrRegister(context.keycloakId);

			if (player.banned) {
				response.push(makePacket(ErrorBannedPacket, {}));
				return;
			}

			// Warning: order of the checks is important, as appendBlockedPacket can add a packet to the response
			if (requirements.notBlocked && BlockingUtils.appendBlockedPacket(player, response)) {
				return;
			}

			if (!await CommandUtils.verifyCommandRequirements(player, context, response, requirements)) {
				return;
			}
			await descriptor.value(response, player, packet, context);
		});
		console.log(`[${packet.name}] Registered packet handler (function '${prop}' in class '${target!.constructor.name}')`);
	};
