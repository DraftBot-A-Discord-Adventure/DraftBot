import {
	format,
	formatPlaceholder,
	parsePlaceholder,
	PlaceholderOperand
} from "../../../../src/core/utils/StringFormatter";

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
test("formatPlaceholder: simple variable", () => {
	expect(formatPlaceholder(parsePlaceholder("testVar", 0, 0), { testVar: "abcdef" })).toBe("abcdef");
});
test("formatPlaceholder: boolean condition true", () => {
	expect(formatPlaceholder(parsePlaceholder("testVar?true:false", 0, 0), { testVar: true })).toBe("true");
});
test("formatPlaceholder: boolean condition false", () => {
	expect(formatPlaceholder(parsePlaceholder("testVar?true:false", 0, 0), { testVar: false })).toBe("false");
});
test("formatPlaceholder: different true", () => {
	expect(formatPlaceholder(parsePlaceholder("testVar!=5?true:false", 0, 0), { testVar: 6 })).toBe("true");
});
test("formatPlaceholder: different false", () => {
	expect(formatPlaceholder(parsePlaceholder("testVar!=5?true:false", 0, 0), { testVar: 5 })).toBe("false");
});
test("formatPlaceholder: equal true", () => {
	expect(formatPlaceholder(parsePlaceholder("testVar==5?true:false", 0, 0), { testVar: 5 })).toBe("true");
});
test("formatPlaceholder: equal false", () => {
	expect(formatPlaceholder(parsePlaceholder("testVar==5?true:false", 0, 0), { testVar: 42 })).toBe("false");
});
test("formatPlaceholder: smaller true", () => {
	expect(formatPlaceholder(parsePlaceholder("testVar<5.1?true:false", 0, 0), { testVar: -9.2 })).toBe("true");
});
test("formatPlaceholder: smaller false", () => {
	expect(formatPlaceholder(parsePlaceholder("testVar<3?true:false", 0, 0), { testVar: 3 })).toBe("false");
});
test("formatPlaceholder: greater true", () => {
	expect(formatPlaceholder(parsePlaceholder("testVar>5.1?true:false", 0, 0), { testVar: 32 })).toBe("true");
});
test("formatPlaceholder: greater false", () => {
	expect(formatPlaceholder(parsePlaceholder("testVar>3?true:false", 0, 0), { testVar: 1 })).toBe("false");
});
test("formatPlaceholder: smaller or equal true", () => {
	expect(formatPlaceholder(parsePlaceholder("testVar<=5.1?true:false", 0, 0), { testVar: 5.1 })).toBe("true");
});
test("formatPlaceholder: smaller or equal false", () => {
	expect(formatPlaceholder(parsePlaceholder("testVar<=3?true:false", 0, 0), { testVar: 9 })).toBe("false");
});
test("formatPlaceholder: greater or equal true", () => {
	expect(formatPlaceholder(parsePlaceholder("testVar>=5.1?true:false", 0, 0), { testVar: 5.1 })).toBe("true");
});
test("formatPlaceholder: greater or equal false", () => {
	expect(formatPlaceholder(parsePlaceholder("testVar>=3?true:false", 0, 0), { testVar: 1 })).toBe("false");
});
test("formatPlaceholder: complex placeholders recursion", () => {
	expect(formatPlaceholder(parsePlaceholder("testVar>=3?{a?b:{c!=d?e:f}}:false", 0, 0), { testVar: 8, a: false, c: 7, d: 8 })).toBe("e");
});
test("format: simple 1", () => {
	expect(format("This is a test! Variable testVar is {testVar} and is {testVar>=testVar2?greater or equal to:smaller than} testVar2 which is {testVar2}", {
		testVar: 5,
		testVar2: 4.9
	})).toBe("This is a test! Variable testVar is 5 and is greater or equal to testVar2 which is 4.9");
});
test("format: simple 2", () => {
	expect(format("This is a test! Variable testVar is {testVar} and is {testVar>=testVar2?greater or equal to:smaller than} testVar2 which is {testVar2}", {
		testVar: 4.8,
		testVar2: 4.9
	})).toBe("This is a test! Variable testVar is 4.8 and is smaller than testVar2 which is 4.9");
});
test("format: complex", () => {
	expect(format("The ultimate test. {a?{b!=5?c:{d?e:f}}:ok} and {g==h?{i}:{j==null?k:l}}", {
		a: true, b: 5, d: false, g: 9.5, h: 9.49
	})).toBe("The ultimate test. f and FORMAT_ERROR:VARIABLE_NOT_IN_REPLACEMENTS");
});