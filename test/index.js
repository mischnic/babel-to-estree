const { parse: babelParse } = require("@babel/parser");
const { parse: acornParse } = require("acorn");
const convert = require("../");
const fs = require("fs");
const assert = require("assert");

const input = fs.readFileSync(__dirname + "/input.js", "utf8");

const babelAst = babelParse(input, { sourceType: "module" });
const acornAst = acornParse(input, { sourceType: "module", locations: true });

const acornAstConverted = convert(babelAst);

{
	function removeIdentifierName(obj) {
		if (typeof obj == "object") {
			for (let prop in obj) {
				if (prop == "identifierName") delete obj.identifierName;
				else removeIdentifierName(obj[prop]);
			}
		}
	}
	removeIdentifierName(acornAstConverted);
}

// fs.writeFileSync("acorn.json", JSON.stringify(acornAst, null, 2));
// fs.writeFileSync("acorn-conv.json", JSON.stringify(acornAstConverted, null, 2));

try {
	assert.deepStrictEqual(
		JSON.parse(JSON.stringify(acornAst)),
		JSON.parse(JSON.stringify(acornAstConverted))
	);
} catch (e) {
	if (!e.message.includes("Input objects not identical")) throw e;
}
