'use strict';

const MODULE_REQUIRE = 1
	/* built-in */
	
	/* NPM */
	, absorb = require('jinang/absorb')
	, co = require('jinang/co')
	, inof = require('jinang/inof')
	, papply = require('jinang/papply')
	, unescaping = require('jinang/unescaping')
	
	/* in-package */

	/* in-module */
	, { KEYTYPE_NAME, SDB } = require('./inc/conf')
	, MYLI = require('./inc/mysql_literal')
	, dump = require('./dump')
	, parseConnection = require('./inc/parseConnection')

	/* in-file */
	, SPACE = '\u0020'

	// Join SQL snippets.
	// S3 means Sql SinppetS.
	, joinS3 = function() {
		let args = Array.from(arguments);
		return args.filter(s => s).join(SPACE);
	}

	, arrayEqual = (a, b) => {
		let equal = (a.length == b.length);
		for (let i = 0; equal && i < a.length; i++) {
			equal = a[i] == b[i];
		}
		return equal;
	}

	, getColumnDef = column => {
		// ---------------------------
		// https://dev.mysql.com/doc/refman/5.7/en/create-table.html
		// ALTER TABLE table_name ADD COLUMN col_name
		// data_type [NOT NULL | NULL] [DEFAULT default_value]
		// [AUTO_INCREMENT] [UNIQUE [KEY]] [[PRIMARY] KEY]
		// [COMMENT 'string']
		// [COLUMN_FORMAT {FIXED|DYNAMIC|DEFAULT}]
		// [STORAGE {DISK|MEMORY|DEFAULT}]
		// [reference_definition]
		// [FIRST|AFTER col_name]
		return joinS3(
			MYLI.id(column.name),
			column.type,
			column.null ? '' : 'NOT NULL',
			(!column.null && column.default == null) ? '' : `DEFAULT ${MYLI(column.default)}`,
			column.autoIncrement ? 'AUTO_INCREMENT' : '',
			column.comment ? `COMMENT ${MYLI(column.comment)}` : ''
		);
	}

	, getKeyDef = key => {
		// ---------------------------
		// ALTER TABLE table_name ADD {INDEX|KEY} [index_name] 
		// [index_type] (index_col_name,...)
		// [index_option]

		let head;
		switch (key.type) {
			case KEYTYPE_NAME.PRI:
				head = `PRIMARY KEY`;
				break;
			case KEYTYPE_NAME.UNI:
				head = `UNIQUE ${MYLI.id(key.name)}`;
				break;
			case KEYTYPE_NAME.MUL:
				head = `KEY ${MYLI.id(key.name)}`;
				break;
		}
		let def = joinS3(
			head,
			key.using ? `USING ${key.using}` : '',
			MYLI.idGroup(key.columns),
			key.comment ? `COMMENT ${MYLI(key.comment)}` : ''
		);
		return def;
	}
	;
	

function reloadTable(table) {
	// ---------------------------
	// CREATE TABLE ...

	let defs = [];

	// column definitions
	inof(table.columns, (name, column) => {
		defs.push(getColumnDef(column));
	});

	// keys
	inof(table.keys, (name, key) => {
		defs.push(getKeyDef(key));
	});
	
	let sql = joinS3(
		'CREATE TABLE',
		MYLI.id(table.name),
		`(${defs.join(', ')})`,
		`ENGINE=${table.engine}`,
		table.charset ? `DEFAULT CHARSET=${table.charset}` : '',
		table.collation ? `DEFAULT COLLATE=${table.collation}` : '',
		table.comment ? `COMMENT=${MYLI(table.comment)}` : null
	);
	return sql;
}

function alterTable(ter, tee) {
	let ADDs = [];
	
	let after = null;
	for (let columnName in tee.columns) {
		let column = tee.columns[columnName];
		if (!ter.columns[columnName]) {
			ADDs.push(joinS3(
				'ADD COLUMN',
				getColumnDef(column),
				after ? `AFTER ${MYLI.id(after)}` : 'FIRST'
			));
		}
		after = columnName;
	}

	for (let keyName in tee.keys) {
		let keyee = tee.keys[keyName];
		let found = false;
		for (let keyName2 in ter.keys) {
			let keyer = ter.keys[keyName2];
			found = (keyer.type == keyee.type) && arrayEqual(keyer.columns, keyee.columns);
			if (found) break;
		}
		if (!found) {
			ADDs.push(joinS3('ADD', getKeyDef(keyee)));
		}
	}

	let SQL = null;
	if (ADDs.length > 0) {
		SQL = joinS3(
			'ALTER TABLE',
			MYLI.id(tee.name),
			ADDs.join(',')
		);
	}
	return SQL;
}

function reloadForeignKey(fk) {
	let { referer, referee } = fk;

	// ---------------------------
	// ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY (column, ...) REFERENCES table_name (column, ...)
	let SQL = joinS3(
		'ALTER TABLE',
		MYLI.id(referer.table),
		'ADD CONSTRAINT',
		MYLI.id(fk.name),
		'FOREIGN KEY',
		MYLI.idGroup(referer.columns),
		'REFERENCES',
		MYLI.id(referee.table),
		MYLI.idGroup(referee.columns),
		fk.onDelete ? `ON DELETE ${fk.onDelete}` : '',
		fk.onUpdate ? `ON UPDATE ${fk.onUpdate}` : ''
	);
	return SQL;
}

/**
 * Compare two databases' skeletons and return the difference which is an array of SQLs.
 * Executing the SQLs in the referer database will make it keeping pace with the referee database.
 * ATTENTION: Do not execute them in the referee database.
 * @param  {Connection} conn
 * @param  {string}     referer  - Referer database name
 * @param  {Object}     referer  - Referer database meta (JSON)
 * @param  {string}     referee  - Referee database name
 * @param  {Object}     referee  - Referer database meta (JSON)
 * @param  {Function}   callback
 * @return {string[]}
 */
function diff(conn, referer, referee, callback) { return co(function*() {
	conn = parseConnection(conn);

	if (typeof referer == 'string') {
		referer = yield dump(conn, referer);
	}

	if (typeof referee == 'string') {
		referee = yield dump(conn, referee);
	}

	if (referer.version != referee.version) {
		throw new Error(`unable to diff schemas in different version: ${referer.version} vs. ${referee.version}`);
	}

	let SQLs = [];
	for (let tableName in referee.tables) {
		let ter = referer.tables[tableName];
		let tee = referee.tables[tableName];
		if (!ter) {
			absorb(SQLs, reloadTable(tee));
		}
		else {
			absorb(SQLs, alterTable(ter, tee));
		}
	}

	for (let name in referee.foreignKeys) {
		let fkee = referee.foreignKeys[name];
		let fker = referer.foreignKeys[name];

		if (!fker) {
			absorb(SQLs, reloadForeignKey(fkee));
		}
	}
	
	return SQLs;
}, callback); }

module.exports = diff;