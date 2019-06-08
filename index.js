const { simple } = require("babylon-walk");

module.exports = convert;

function coerceFunctionIntoValue(node) {
	node.value = {
		type: "FunctionExpression",
		generator: node.generator,
		async: node.async,
		params: node.params,
		body: node.body,

		// TODO loc:
		//
		// node = {
		// 	exit(node) {
		// 		node.type = "Property";
		// 	}
		// };
		//
		// class Class extends Object {
		//     constructor(...args) {
		//         super.init(args);
		//     }
		//     foo() {}
		// }
		loc: {
			start: ((node.params[0] && node.params[0]) || node.body).loc.start,
			end: node.body.loc.end
		},
		start: ((node.params[0] && node.params[0]) || node.body).start,
		end: node.end,
		id: null,
		expression: false
	};
	delete node.generator;
	delete node.async;
	delete node.params;
	delete node.body;

	delete node.id;
}

function convert(ast) {
	if (shouldClone) ast = clone(ast);
	if (ast.program) ast = ast.program;
	simple(ast, {
		JSXText(node) {
			node.raw = node.extra.raw;
			delete node.extra;
		},

		"StringLiteral|NumericLiteral|BooleanLiteral|NullLiteral"(node) {
			if (node.type == "NullLiteral") {
				node.value = null;
			}

			node.raw = (node.extra && node.extra.raw) || String(node.value);
			delete node.extra;

			node.type = "Literal";
		},

		RegExpLiteral(node) {
			node.type = "Literal";
			node.raw = node.extra.raw;
			delete node.extra;

			node.value = new RegExp(node.pattern, node.flags);
			node.regex = {
				pattern: node.pattern,
				flags: node.flags
			};
			delete node.pattern;
			delete node.flags;
		},

		ObjectProperty: {
			exit(node) {
				node.type = "Property";
				delete node.extra;
			}
		},

		"ObjectPattern|ObjectExpression": {
			exit(node) {
				node.properties.forEach(
					prop =>
						prop.type != "RestElement" &&
						(prop.kind = prop.kind || "init")
				);
			}
		},

		Program(node) {
			delete node.directives;
			delete node.interpreter;
		},

		ClassMethod: {
			exit(node) {
				node.type = "MethodDefinition";
				coerceFunctionIntoValue(node);
			}
		},
		ObjectMethod: {
			exit(node) {
				node.type = "Property";
				node.shorthand = false;
				coerceFunctionIntoValue(node);
			}
		},
		"FunctionDeclaration|FunctionExpression"(node) {
			node.expression = false;
		},

		BlockStatement(node) {
			delete node.directives;
		},

		ArrowFunctionExpression(node) {
			node.expression = node.body.type !== "BlockStatement";
		}
	});
	return ast;
}
