/**
 * Dump the skeleton of a database into dbqp-style formatted JSON.
 */

'use strict';

const MODULE_REQUIRE = 1
	/* built-in */
	
	/* NPM */
	, co = require('jinang/co')
	, mysql = require('mysql')
	
	/* in-package */

	/* in-module */
	, { 
		KEYTYPE_NAME,
		SDB, /* Schema Database. */		
		} = require('./inc/conf')
	, parseConnection = require('./inc/parseConnection')
	, promiseQuery = require('./inc/promiseQuery')
	;

function dump(conn, dbname, callback) { return co(function*() {	
	conn = parseConnection(conn);

	const promiseSchemaQuery = Q => {
		let { columns, table, ands, and, or, orderBy } = Q;
		
		let _select, _from, _where, _orderBy;

		// SELECT ...
		_select = `SELECT ${ columns ? columns.join(',') : '*' }`;
		
		// FROM ...
		_from = `FROM ${SDB}.${table}`;
		
		// WHERE ... AND ...
		if (1) {
			if (!ands) {
				ands = [ `TABLE_SCHEMA = '${dbname}'` ];
			}

			if (typeof and == 'string') {
				ands.push(and);
			}
			else if (and instanceof Array) {
				ands = ands.concat(and);
			}

			if (typeof or == 'string') {
				ands.push(`(${or})`);
			}
			else if (or instanceof Array) {
				ands.push(`(${or.join(' OR ')})`);
			}
			
			_where = `WHERE ${ands.join(' AND ')}`;
		}

		// ORDER BY ...
		if ( orderBy ) {
			_orderBy = `ORDER BY ${orderBy}`;
		}
		
		// Make up the whole SQL.
		let sql = [ _select, _from, _where, _orderBy ].join(' ');
		return promiseQuery(conn, sql);
	};
		
	let tables, foreignKeys;

	const collation2charset = {};
	if (1) {
		let sql = `SELECT * FROM ${SDB}.COLLATION_CHARACTER_SET_APPLICABILITY`;
		let ret = yield promiseQuery(conn, sql);
		ret.rows.forEach(row => 
			collation2charset[row.COLLATION_NAME] = row.CHARACTER_SET_NAME);
	}
	
	// Get basic info of tables.
	if (1) {
		tables = {};
		let Q = {};
		// SEE https://dev.mysql.com/doc/refman/5.7/en/tables-table.html
		Q.columns = [
			'TABLE_NAME', 
			
			// > TABLE_TYPE should be BASE TABLE or VIEW. 
			// > The TABLES table does not list TEMPORARY tables.
			'TABLE_TYPE',

			'ENGINE', 
			'AUTO_INCREMENT', 
			'TABLE_COLLATION', 
			'TABLE_COMMENT',
			];
		Q.table = 'TABLES';
		let ret = yield promiseSchemaQuery(Q);
		ret.rows.forEach(row => { 
			let type = row.TABLE_TYPE == 'VIEW' ? 'view' : 'table';
			// @todo 支持视图。
			if (type == 'view') return;

			tables[ row.TABLE_NAME ] = {
				name          : row.TABLE_NAME,
				engine        : row.ENGINE,
				autoIncrement : row.AUTO_INCREMENT, /* auto_increment cursor number */
				comment       : row.TABLE_COMMENT,
				collation     : row.TABLE_COLLATION,
				charset       : collation2charset[row.TABLE_COLLATION],
				type,

				// Other properties.
				columns       : {},
				keys          : {},
			};
		});
	}

	// Get table columns.
	if (1) {
		let Q = {};
		// Keep order in information_schema.COLUMNS .
		Q.columns = [
			'TABLE_NAME',
			'COLUMN_NAME', 
			'ORDINAL_POSITION', 
			
			// Without default value provided, this column is filled with 
			// empty value <NULL>.
			// In MySQL CLI, both <NULL> and string 'NULL' are displayed as
			// `NULL` in SELECT or DESC sentences. Please do not misunderstand.
			'COLUMN_DEFAULT', 

			'IS_NULLABLE', 
			'DATA_TYPE',
			'CHARACTER_MAXIMUM_LENGTH',
			'CHARACTER_OCTET_LENGTH',
			'NUMERIC_PRECISION',
			'NUMERIC_SCALE',
			'DATETIME_PRECISION',
			'CHARACTER_SET_NAME',
			'COLLATION_NAME',
			'COLUMN_TYPE',

			// ENUM('PRI', 'MUL', ?)
			// - PRI = this column is constrained by a primary key.
			// - MUL = this column is constrained by key(s) but not primary key.
			// SEE https://stackoverflow.com/questions/5317889/sql-keys-mul-vs-pri-vs-uni
			'COLUMN_KEY',
			
			// SEE https://dev.mysql.com/doc/refman/5.7/en/show-columns.html
			// > The value is nonempty in these cases:
			// > * auto_increment for columns that have the AUTO_INCREMENT attribute
			// > * on update CURRENT_TIMESTAMP for TIMESTAMP or DATETIME columns that have the ON UPDATE CURRENT_TIMESTAMP attribute
			// > * VIRTUAL GENERATED or VIRTUAL STORED for generated columns
			'EXTRA',
			
			'PRIVILEGES',
			'COLUMN_COMMENT',
			'GENERATION_EXPRESSION',
			];
		Q.table = 'COLUMNS';
		Q.orderBy = 'TABLE_NAME, ORDINAL_POSITION ASC';
		let ret = yield promiseSchemaQuery(Q);
		ret.rows.forEach(row => {
			let table = tables[ row.TABLE_NAME ];

			// Views are ignored on dump.
			if (!table) return;
			
			table.columns[ row.COLUMN_NAME ] = {
				name          : row.COLUMN_NAME,
				type          : row.COLUMN_TYPE,
				null          : row.IS_NULLABLE == 'YES',
				default       : row.COLUMN_DEFAULT,
				oridinal      : row.ORDINAL_POSITION,
				comment       : row.COLUMN_COMMENT,
				autoIncrement : row.extra == 'auto_increment',
			};
		});
	}

	// Here, we suppose that:
	//   Keys = Constraints + Indexes

	// // Get Constraints basic info.
	// // This step is not ver necessary because we can initialize the keys in 
	// // the following steps.
	// if (1) {
	// 	let Q = {};
	// 	Q.columns = [
	// 		// Literal name OR 'PRIMARY'.
	// 		// Contraint name 'PRIMARY' is preserved.
	// 		'CONSTRAINT_NAME',

	// 		'TABLE_NAME',

	// 		// ENUM('UNIQUE', 'PRIMARY KEY', 'FOREIGN KEY')
	// 		'CONSTRAINT_TYPE',
	// 		];
	// 	Q.table = 'TABLE_CONSTRAINTS';
	// 	let ret = yield promiseSchemaQuery(Q);
	// 	ret.rows.forEach(row => {
	// 		let table = tables[ row.TABLE_NAME ];
	// 		table.keys[ row.CONSTRAINT_NAME ] = {
	// 			type     : row.CONSTRAINT_TYPE,
	// 			columns  : [],
	// 		};
	// 	});
	// }

	// Get Indexes (Keys but FKs).
	if (1) {
		let Q = {};
		Q.columns = [
			'TABLE_NAME',
			'NON_UNIQUE',
			'INDEX_NAME',
			'SEQ_IN_INDEX',
			'COLUMN_NAME',
			'COLLATION',
			'CARDINALITY',
			'SUB_PART',
			'PACKED',
			'NULLABLE',
			'INDEX_TYPE',
			'COMMENT',
			'INDEX_COMMENT',
			];
		Q.table = 'STATISTICS';
		let ret = yield promiseSchemaQuery(Q);
		ret.rows.forEach(row => {
			let table = tables[ row.TABLE_NAME ];
			let key = table.keys[ row.INDEX_NAME ];

			if (!key) {
				let type;
				if (row.INDEX_NAME == 'PRIMARY') {
					type = KEYTYPE_NAME.PRI;
				}
				else if (!row.NON_UNIQUE) {
					type = KEYTYPE_NAME.UNI;			
				}
				else {
					type = KEYTYPE_NAME.MUL;
				}

				key = { 
					name    : row.INDEX_NAME,
					type, 
					columns : [],
					using   : row.INDEX_TYPE,
					comment : row.INDEX_COMMENT,
				};
				table.keys[ row.INDEX_NAME ] = key;
			}

			// SEQ_IN_INDEX starts from 1.
			key.columns[ row.SEQ_IN_INDEX - 1 ] = row.COLUMN_NAME;
		});
	}

	// Get FKs.
	if (1) {
		foreignKeys = {};
		let Q = {};
		Q.columns = [
			// Constraint name is unique in current database.
			'CONSTRAINT_NAME',

			'UNIQUE_CONSTRAINT_CATALOG',
			'UNIQUE_CONSTRAINT_SCHEMA',
			'UNIQUE_CONSTRAINT_NAME',
			'MATCH_OPTION',
			'UPDATE_RULE',
			'DELETE_RULE',
			'TABLE_NAME',
			'REFERENCED_TABLE_NAME',
			];
		Q.table = 'REFERENTIAL_CONSTRAINTS';
		Q.ands = [ `CONSTRAINT_SCHEMA = '${dbname}'` ];
		let ret = yield promiseSchemaQuery(Q);
		ret.rows.forEach(row => {

			
			// Left side of keyword REFERENCES in SQL.
			let referer = {
				table   : row.TABLE_NAME,
				columns : [],
			};
			
			// Right side of keyword REFERENCES in SQL.
			let referee = {
				table   : row.REFERENCED_TABLE_NAME,
				columns : [],
			};

			foreignKeys[ row.CONSTRAINT_NAME ] = {
				name     : row.CONSTRAINT_NAME,
				referer,
				referee,
				onDelete : row.DELETE_RULE,
				onUpdate : row.UPDATE_RULE,
			};
		});
	}

	// Get FK columns.
	if (1) {
		let Q = {};
		Q.columns = [
			// Constraint name is unique in current database.
			'CONSTRAINT_NAME',
			
			'TABLE_SCHEMA',
			'TABLE_NAME',
			'COLUMN_NAME',
			
			'ORDINAL_POSITION',
			'POSITION_IN_UNIQUE_CONSTRAINT',

			'REFERENCED_TABLE_SCHEMA',
			'REFERENCED_TABLE_NAME',
			'REFERENCED_COLUMN_NAME',
			];
		Q.table = 'KEY_COLUMN_USAGE';
		Q.and = 'REFERENCED_TABLE_SCHEMA IS NOT NULL';
		Q.orderBy = 'CONSTRAINT_NAME, ORDINAL_POSITION ASC';
		let ret = yield promiseSchemaQuery(Q);
		ret.rows.forEach(row => {
			let foreignKey = foreignKeys[ row.CONSTRAINT_NAME ];

			// The following validation is not necessary.
			// foreignKey.referer.table == row.TABLE_NAME
			// foreignKey.referee.table == row.REFERENCED_TABLE_NAME

			foreignKey.referer.columns.push( row.COLUMN_NAME );
			foreignKey.referee.columns.push( row.REFERENCED_COLUMN_NAME );
		});
	}

	return { version: '1.0', tables, foreignKeys };
}, callback); }

module.exports = dump;