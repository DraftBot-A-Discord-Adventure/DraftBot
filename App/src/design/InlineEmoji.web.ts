import type { ImageStyle } from "react-native";

/** react-native-web hands CSS through, which React Native's types do not model on an image. */
type WebImageStyle = ImageStyle & { verticalAlign: "text-bottom" };

/**
 * expo-image draws its picture over an empty first child, so the browser takes the top of the box for its
 * baseline and an emoji set among words hangs below the line. Aligned on the text's bottom, it sits in it.
 */
export const inlineEmojiStyle: WebImageStyle = { verticalAlign: "text-bottom" };
