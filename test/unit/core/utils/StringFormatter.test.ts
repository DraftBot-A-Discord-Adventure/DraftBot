import {parsePlaceholder, PlaceholderOperand} from "../../../../src/core/utils/StringFormatter";

test("parsePlaceholder: simple variable", () => {
	expect(parsePlaceholder("test_variable", 5, 18)).toStrictEqual({
		leftValue: "test_variable",
		rightValue: null,
		operand: null,
		start: 5,
		end: 18,
		trueValue: null,
		falseValue: null
	});
});
test("parsePlaceholder: simple boolean variable", () => {
	expect(parsePlaceholder("test_var?abcdef:ghijkl", 5, 26)).toStrictEqual({
		leftValue: "test_var",
		rightValue: null,
		operand: PlaceholderOperand.BOOL,
		start: 5,
		end: 26,
		trueValue: "abcdef",
		falseValue: "ghijkl"
	});
});
test("parsePlaceholder: simple greater than 5", () => {
	expect(parsePlaceholder("test_var>5?true:false", 4, 9)).toStrictEqual({
		leftValue: "test_var",
		rightValue: "5",
		operand: PlaceholderOperand.GREATER,
		start: 4,
		end: 9,
		trueValue: "true",
		falseValue: "false"
	});
});
test("parsePlaceholder: simple smaller than 8", () => {
	expect(parsePlaceholder("test_var<8?true:false", 123, 1324)).toStrictEqual({
		leftValue: "test_var",
		rightValue: "8",
		operand: PlaceholderOperand.SMALLER,
		start: 123,
		end: 1324,
		trueValue: "true",
		falseValue: "false"
	});
});
test("parsePlaceholder: simple greater or equal than 6", () => {
	expect(parsePlaceholder("test_var>=6?true:false", 1, 2)).toStrictEqual({
		leftValue: "test_var",
		rightValue: "6",
		operand: PlaceholderOperand.GREATER_OR_EQUAL,
		start: 1,
		end: 2,
		trueValue: "true",
		falseValue: "false"
	});
});
test("parsePlaceholder: simple smaller or equal than 42", () => {
	expect(parsePlaceholder("test_var<=42?true:false", 1, 2)).toStrictEqual({
		leftValue: "test_var",
		rightValue: "42",
		operand: PlaceholderOperand.SMALLER_OR_EQUAL,
		start: 1,
		end: 2,
		trueValue: "true",
		falseValue: "false"
	});
});
test("parsePlaceholder: simple equal to abcdef", () => {
	expect(parsePlaceholder("test_var==abcdef?true:false", 1, 2)).toStrictEqual({
		leftValue: "test_var",
		rightValue: "abcdef",
		operand: PlaceholderOperand.EQUAL,
		start: 1,
		end: 2,
		trueValue: "true",
		falseValue: "false"
	});
});
test("parsePlaceholder: simple equal to abcdef", () => {
	expect(parsePlaceholder("test_var!=abcdef?true:false", 1, 2)).toStrictEqual({
		leftValue: "test_var",
		rightValue: "abcdef",
		operand: PlaceholderOperand.DIFFERENT,
		start: 1,
		end: 2,
		trueValue: "true",
		falseValue: "false"
	});
});
test("parsePlaceholder: simple variable with true value a placeholder", () => {
	expect(parsePlaceholder("test_var?{test_var2?true2:false2}:false", 1, 2)).toStrictEqual({
		leftValue: "test_var",
		rightValue: null,
		operand: PlaceholderOperand.BOOL,
		start: 1,
		end: 2,
		trueValue: {
			leftValue: "test_var2",
			rightValue: null,
			operand: PlaceholderOperand.BOOL,
			start: 9,
			end: 32,
			trueValue: "true2",
			falseValue: "false2"
		},
		falseValue: "false"
	});
});
test("parsePlaceholder: hyper complexe placeholder", () => {
	expect(parsePlaceholder("test_var!=314159a?{test_var2?true2:{test_var3?true3:false3}}:{a?{b?c:{d!=7?e:f}}:c}", 1, 2)).toStrictEqual({
		leftValue: "test_var",
		rightValue: "314159a",
		operand: PlaceholderOperand.DIFFERENT,
		start: 1,
		end: 2,
		trueValue: {
			leftValue: "test_var2",
			rightValue: null,
			operand: PlaceholderOperand.BOOL,
			start: 18,
			end: 59,
			trueValue: "true2",
			falseValue: {
				leftValue: "test_var3",
				rightValue: null,
				operand: PlaceholderOperand.BOOL,
				start: 16,
				end: 39,
				trueValue: "true3",
				falseValue: "false3"
			}
		},
		falseValue: {
			leftValue: "a",
			rightValue: null,
			operand: PlaceholderOperand.BOOL,
			start: 61,
			end: 82,
			trueValue: {
				leftValue: "b",
				rightValue: null,
				operand: PlaceholderOperand.BOOL,
				start: 2,
				end: 17,
				trueValue: "c",
				falseValue: {
					leftValue: "d",
					rightValue: "7",
					operand: PlaceholderOperand.DIFFERENT,
					start: 4,
					end: 13,
					trueValue: "e",
					falseValue: "f"
				}
			},
			falseValue: "c"
		}
	});
});
test("parsePlaceholder: Malformed placeholder", () => {
	expect(parsePlaceholder("malformed?ok", 1, 2)).toStrictEqual({
		leftValue: "malformed?ok",
		rightValue: null,
		operand: null,
		start: 1,
		end: 2,
		trueValue: null,
		falseValue: null
	});
	expect(parsePlaceholder("malformed{}", 1, 2)).toStrictEqual({
		leftValue: "malformed{}",
		rightValue: null,
		operand: null,
		start: 1,
		end: 2,
		trueValue: null,
		falseValue: null
	});
});