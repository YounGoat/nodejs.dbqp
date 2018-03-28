'use strict';

const MODULE_REQUIRE = 1
	/* built-in */
	
	/* NPM */
	, mysql = require('mysql')
	
	/* in-package */
	;

function parseConnection(conn) {
	if (conn && conn.constructor.name == 'Connection') {
		return conn;
	}
	else {
		return new mysql.Connection(conn);
	}
}

module.exports = parseConnection;