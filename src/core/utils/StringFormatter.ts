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

/* export const formatBackup = function(text: string, replacements: Replacements): string {
	const placeholders: ReplacementPlaceholder[] = [];
	const keys = Object.keys(replacements);
	for (let i = 0; i < text.length; ++i) {
		if (text[i] === "{") {
			const start = i;
			let condition1Start = -1;
			let condition1End = -1;
			let condition2Start: number = null;
			while (text[i] !== "}" && i < text.length) {
				if (i !== text.length - 1 && text[i + 1] !== "}") {
					if (text[i] === "?" && condition1Start === -1) {
						condition1Start = i + 1;
					}
					else if (text[i] === ":" && condition1Start !== -1) {
						condition1End = i;
						condition2Start = i + 1;
					}
				}
				++i;
			}
			if (i === text.length) {
				continue;
			}
			const name = text.substring(start + 1, condition1Start !== -1 ? condition1Start - 1 : i);
			if (keys.includes(name)) {
				if (condition1Start !== -1 && condition1End !== -1 && condition2Start !== -1) {
					placeholders.push({
						name,
						start,
						end: i,
						condition1: text.substring(condition1Start, condition1End),
						condition2: text.substring(condition2Start, i)
					});
				}
				else {
					placeholders.push({
						name,
						start,
						end: i,
						condition1: null,
						condition2: null
					});
				}
			}
		}
	}
	let newText = text;
	for (let i = placeholders.length - 1; i >= 0; --i) {
		const placeholder = placeholders[i];
		let value: string;
		if (placeholder.condition1) {
			value = replacements[placeholder["name"]] === true ? placeholder.condition1 : placeholder.condition2;
		}
		else {
			value = replacements[placeholder["name"]];
		}
		newText = newText.substring(0, placeholder.start) + value + newText.substring(placeholder.end + 1, newText.length);
	}
	return newText;
};*/