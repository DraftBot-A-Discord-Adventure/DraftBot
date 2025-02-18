import {DraftBotPacket, makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {PetEntities, PetEntity} from "../../core/database/game/models/PetEntity";
import {commandRequires, CommandUtils} from "../../core/utils/CommandUtils";
import Player from "../../core/database/game/models/Player";
import {
	CommandPetSellBadPricePacketRes,
	CommandPetSellFeistyErrorPacket, CommandPetSellGuildAtMaxLevelErrorPacket,
	CommandPetSellNoPetErrorPacket,
	CommandPetSellNotInGuildErrorPacket,
	CommandPetSellPacketReq
} from "../../../../Lib/src/packets/commands/CommandPetSellPacket";
import {Guild, Guilds} from "../../core/database/game/models/Guild";
import {Pet, PetDataController} from "../../data/Pet";
import {PetSellConstants} from "../../../../Lib/src/constants/PetSellConstants";
import {EndCallback, ReactionCollectorInstance} from "../../core/utils/ReactionsCollector";
import {ReactionCollectorAcceptReaction} from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {CommandPetFreeRefusePacketRes} from "../../../../Lib/src/packets/commands/CommandPetFreePacket";
import {BlockingUtils} from "../../core/utils/BlockingUtils";
import {BlockingConstants} from "../../../../Lib/src/constants/BlockingConstants";
import {ReactionCollectorPetFree} from "../../../../Lib/src/packets/interaction/ReactionCollectorPetFree";
import {SexTypeShort} from "../../../../Lib/src/constants/StringConstants";
import {PetFreeConstants} from "../../../../Lib/src/constants/PetFreeConstants";
import {ReactionCollectorPetSell} from "../../../../Lib/src/packets/interaction/ReactionCollectorPetSell";

type SellerInformation = { player: Player, pet: PetEntity, petModel: Pet, guild: Guild, petCost: number };

/**
 * Check if the requirements for selling the pet are fulfilled
 * @param response
 * @param sellerInformation
 */
function missingRequirementsToSellPet(response: DraftBotPacket[], sellerInformation: SellerInformation): boolean {
	if (!sellerInformation.pet) {
		response.push(makePacket(CommandPetSellNoPetErrorPacket, {}));
		return true;
	}

	if (sellerInformation.pet.isFeisty()) {
		response.push(makePacket(CommandPetSellFeistyErrorPacket, {}));
		return true;
	}

	if (sellerInformation.petCost < PetSellConstants.SELL_PRICE.MIN || sellerInformation.petCost > PetSellConstants.SELL_PRICE.MAX) {
		response.push(makePacket(CommandPetSellBadPricePacketRes, {
			minPrice: PetSellConstants.SELL_PRICE.MIN,
			maxPrice: PetSellConstants.SELL_PRICE.MAX
		}));
		return true;
	}

	if (sellerInformation.guild.isAtMaxLevel()) {
		response.push(makePacket(CommandPetSellGuildAtMaxLevelErrorPacket, {}));
		return true;
	}

	return false;
}

function getAcceptCallback() {
	return async (user: User): Promise<boolean> => {
		const [buyer] = await Players.getOrRegister(user.id);
		const buyerInformation = {user, buyer};
		if (await sendBlockedError(textInformation.interaction, textInformation.petSellModule.language, buyerInformation.user)) {
			buyerInformation.buyer = null;
			return false;
		}
		if (buyerInformation.buyer.effect === EffectsConstants.EMOJI_TEXT.BABY) {
			await sendErrorMessage(buyerInformation.user, textInformation.interaction, textInformation.petSellModule.language, textInformation.petSellModule.format("babyError"), false, false);
			buyerInformation.buyer = null;
			return false;
		}

		await petSell(textInformation, sellerInformation, buyerInformation);
		return true;
	};
}

export default class PetSellCommand {
	@commandRequires(CommandPetSellPacketReq, {
		notBlocked: true,
		allowedEffects: CommandUtils.ALLOWED_EFFECTS.NO_EFFECT
	})
	async execute(response: DraftBotPacket[], player: Player, packet: CommandPetSellPacketReq): Promise<void> {
		const pet = await PetEntities.getById(player.petId);

		if (!pet) {
			response.push(makePacket(CommandPetSellNoPetErrorPacket, {}));
			return;
		}

		let guild;
		try {
			guild = await Guilds.getById(player.guildId);
		}
		catch {
			guild = null;
		}

		if (guild === null) {
			// Not in a guild
			response.push(makePacket(CommandPetSellNotInGuildErrorPacket, {}));
			return;
		}

		const sellerInformation = {player, pet, petModel: PetDataController.instance.getById(pet.typeId), guild, petCost: packet.price};

		if (missingRequirementsToSellPet(response, sellerInformation)) {
			return;
		}

		// Send collector
		const collector = new ReactionCollectorPetSell(
			player.keycloakId,
			packet.price,
			guild.isAtMaxLevel(),
			pet.asOwnedPet()
		);

		const endCallback: EndCallback = async (collector: ReactionCollectorInstance, response: DraftBotPacket[]): Promise<void> => {

		};

		const collectorPacket = new ReactionCollectorInstance(
			collector,
			context,
			{
				allowedPlayerKeycloakIds: [player.keycloakId],
				reactionLimit: 1
			},
			endCallback
		)
			.block(player.id, BlockingConstants.REASONS.PET_SELL)
			.build();

		response.push(collectorPacket);

		await new DraftBotBroadcastValidationMessage(
			interaction,
			language,
			getAcceptCallback(sellerInformation, textInformation),
			BlockingConstants.REASONS.PET_SELL,
			getBroadcastErrorStrings(petSellModule))
			.setTitle(textInformation.petSellModule.get("sellMessage.title"))
			.setDescription(
				textInformation.petSellModule.format("sellMessage.description", {
					author: escapeUsername(textInformation.interaction.user.username),
					price: sellerInformation.petCost,
					guildMaxLevel: sellerInformation.guild.isAtMaxLevel()
				})
			)
			.addFields([{
				name: textInformation.petSellModule.get("petFieldName"),
				value: Translations.getModule("commands.profile", textInformation.petSellModule.language).format("pet.fieldValue", {
					rarity: (await Pets.getById(sellerInformation.pet.petId)).getRarityDisplay(),
					emote: sellerInformation.pet.getPetEmote(petModel),
					nickname: sellerInformation.pet.nickname ? sellerInformation.pet.nickname : sellerInformation.pet.getPetTypeName(petModel, textInformation.petSellModule.language)
				}),
				inline: false
			}])
			.setFooter({text: textInformation.petSellModule.get("sellMessage.footer")})
			.reply();
	}
}