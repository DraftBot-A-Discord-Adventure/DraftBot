export interface Replacements {
	[key: string]: any
}

export enum PlaceholderOperand {
	EQUAL,
	GREATER,
	SMALLER,
	GREATER_OR_EQUAL,
	SMALLER_OR_EQUAL,
	DIFFERENT,
	BOOL
}

interface ReplacementPlaceholder {
	leftValue: string,
	rightValue: string,
	operand: PlaceholderOperand
	start: number,
	end: number,
	trueValue: string | ReplacementPlaceholder,
	falseValue: string | ReplacementPlaceholder
}

export const parsePlaceholder = function(placeholder: string, start: number, end: number): ReplacementPlaceholder {
	const defaultReturn: ReplacementPlaceholder = {
		leftValue: placeholder,
		rightValue: null,
		operand: null,
		start,
		end,
		trueValue: null,
		falseValue: null
	};
	const interrogationPosition = placeholder.indexOf("?");
	let trueValue;
	let falseValue;
	if (interrogationPosition !== -1) {
		const conditionPart = placeholder.substring(0, interrogationPosition);
		let falseValueBeginning;
		if (placeholder.length > interrogationPosition + 1 && placeholder[interrogationPosition + 1] === "{") {
			let endPlaceholder = interrogationPosition + 2;
			let openedBrackets = 0;
			while (placeholder.length !== endPlaceholder) {
				if (placeholder[endPlaceholder] === "{") {
					openedBrackets++;
				}
				else if (placeholder[endPlaceholder] === "}") {
					if (openedBrackets > 0) {
						openedBrackets--;
					}
					else {
						break;
					}
				}
				endPlaceholder++;
			}
			if (endPlaceholder === placeholder.length) {
				return defaultReturn;
			}
			trueValue = parsePlaceholder(placeholder.substring(interrogationPosition + 2, endPlaceholder), interrogationPosition + 1, endPlaceholder);
			falseValueBeginning = endPlaceholder + 2;
		}
		else {
			const colonPosition = placeholder.substring(interrogationPosition).indexOf(":") + interrogationPosition;
			if (colonPosition === interrogationPosition - 1) {
				return defaultReturn;
			}
			trueValue = placeholder.substring(interrogationPosition + 1, colonPosition);
			falseValueBeginning = colonPosition + 1;
		}
		if (placeholder[falseValueBeginning] === "{") {
			falseValue = parsePlaceholder(placeholder.substring(falseValueBeginning + 1, placeholder.length - 1), falseValueBeginning, placeholder.length - 1);
		}
		else {
			falseValue = placeholder.substring(falseValueBeginning);
		}
		const conditionSplit = conditionPart.split(/(==|!=|<=|>=|>|<)/);
		let leftValue: string;
		let rightValue: string;
		let operand: PlaceholderOperand;
		if (conditionSplit.length === 1) {
			leftValue = conditionPart;
			rightValue = null;
			operand = PlaceholderOperand.BOOL;
		}
		else {
			leftValue = conditionSplit[0];
			rightValue = conditionSplit[2];
			switch (conditionSplit[1]) {
			case "==":
				operand = PlaceholderOperand.EQUAL;
				break;
			case "<=":
				operand = PlaceholderOperand.SMALLER_OR_EQUAL;
				break;
			case ">=":
				operand = PlaceholderOperand.GREATER_OR_EQUAL;
				break;
			case "!=":
				operand = PlaceholderOperand.DIFFERENT;
				break;
			case "<":
				operand = PlaceholderOperand.SMALLER;
				break;
			case ">":
				operand = PlaceholderOperand.GREATER;
				break;
			default:
				operand = PlaceholderOperand.BOOL;
				break;
			}
		}
		return {
			leftValue,
			rightValue,
			operand,
			start,
			end,
			trueValue,
			falseValue
		};
	}
	return defaultReturn;
};

export const formatPlaceholder = function(placeholder: ReplacementPlaceholder, replacements: Replacements): string {
	if (placeholder.operand === null) {
		if (placeholder.leftValue in replacements) {
			const replacement = replacements[placeholder.leftValue];
			if (typeof replacement === "string") {
				return replacement;
			}
			return replacement.toString();
		}
		return placeholder.leftValue;
	}
	let conditionResult = false;
	const leftValueFloat = parseFloat(placeholder.leftValue);
	const rightValueFloat = parseFloat(placeholder.rightValue);
	const leftValue: number = isNaN(leftValueFloat) ? placeholder.leftValue in replacements ? replacements[placeholder.leftValue] : null : leftValueFloat;
	const rightValue: number = isNaN(rightValueFloat) ? placeholder.rightValue in replacements ? replacements[placeholder.rightValue] : null : rightValueFloat;
	if (leftValue === null || rightValue === null && placeholder.operand !== PlaceholderOperand.BOOL) {
		return "FORMAT_ERROR:VARIABLE_NOT_IN_REPLACEMENTS";
	}
	switch (placeholder.operand) {
	case PlaceholderOperand.BOOL:
		conditionResult = replacements[placeholder.leftValue] === true;
		break;
	case PlaceholderOperand.DIFFERENT:
		conditionResult = leftValue !== rightValue;
		break;
	case PlaceholderOperand.EQUAL:
		conditionResult = leftValue === rightValue;
		break;
	case PlaceholderOperand.SMALLER_OR_EQUAL:
		conditionResult = leftValue <= rightValue;
		break;
	case PlaceholderOperand.SMALLER:
		conditionResult = leftValue < rightValue;
		break;
	case PlaceholderOperand.GREATER_OR_EQUAL:
		conditionResult = leftValue >= rightValue;
		break;
	case PlaceholderOperand.GREATER:
		conditionResult = leftValue > rightValue;
		break;
	default:
		break;
	}
	const value = conditionResult ? placeholder.trueValue : placeholder.falseValue;
	if (typeof value === "string") {
		return value;
	}
	return formatPlaceholder(value, replacements);
};

export const format = function(text: string, replacements: Replacements): string {
	const placeholders = [];
	for (let i = 0; i < text.length; ++i) {
		if (text[i] === "{") {
			const startBracket = i;
			let openedBrackets = 0;
			for (i++; i < text.length; ++i) {
				if (text[i] === "{") {
					openedBrackets++;
				}
				if (text[i] === "}") {
					if (openedBrackets > 0) {
						openedBrackets--;
					}
					else {
						placeholders.push(parsePlaceholder(text.substring(startBracket + 1, i), startBracket, i));
						break;
					}
				}
			}
		}
	}
	let newText = text;
	for (let i = placeholders.length - 1; i >= 0; --i) {
		const ph = placeholders[i];
		newText = newText.substring(0, ph.start) + formatPlaceholder(ph, replacements) + newText.substring(ph.end + 1, newText.length);
	}
	return newText;
};
