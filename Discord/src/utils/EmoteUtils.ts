export class EmoteUtils {

	/**
	 * Map of emojis to their Discord equivalent
	 * TODO : ADD EMOJI TRANSLATION WHEN YOU SEE A DESCREPANCY PLEASE, THANKS, DON'T BE FOOLS
	 * @private
	 */
	private static emojiUnicodeMap: Record<string, string> = {
		"⛰": ":mountain:"
	};

	/**
	 * Translates an emoji to its Discord equivalent when necessary
	 * @param emoji
	 */
	static translateEmojiToDiscord(emoji: string): string {
		if (this.emojiUnicodeMap[emoji]) {
			return this.emojiUnicodeMap[emoji];
		}
		return emoji;
	}
}