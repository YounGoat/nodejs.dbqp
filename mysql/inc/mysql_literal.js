/**
 * SEE
 *   MySQL 5.7 Reference Manual / Language Structure / Literal Values
 *   https://dev.mysql.com/doc/refman/5.7/en/literals.html
 */

'use strict';

const MODULE_REQUIRE = 1
	/* built-in */
	
	/* NPM */
	
	/* in-package */
	;

const ESC = '\u0060'; // Escaper
const SQU = '\u0027'; // Single Quote
const CMA = '\u002C'; // Comma
const LPA = '\u0028'; // Left Parenthesis
const RPA = '\u0029'; // Rigt Parenthesis


function mysql_literal(value) {
	if (typeof value == 'string') {
		return SQU + value.replace(SQU, SQU + SQU) + SQU;
	}

	if (typeof value == 'number') {
		return value + '';
	}

	if (typeof value == 'boolean') {
		return value ? '1' : '0';
	}
	
	if (value === null || value === undefined) {
		return 'NULL';
	}

	// @todo 
	throw new Error(`failed on converting to MySQL literal expression: ${value}`);
}

function identifier(name) {
	return ESC + name + ESC;
}

function identifiers(names) {
	return names.map(identifier).join(CMA);
}

function identifierGroup(names) {
	return LPA + identifiers(names) + RPA;
}

mysql_literal.id = identifier;
mysql_literal.ids = identifiers;
mysql_literal.idGroup = identifierGroup;

module.exports =  mysql_literal;