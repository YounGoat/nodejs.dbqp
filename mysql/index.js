'use strict';

const MODULE_REQUIRE = 1
	/* built-in */
	
	/* NPM */
	, mysql = require('mysql')
	, papply = require('jinang/papply')
	, if2 = require('if2')
	
	/* in-package */
	
	/* in-module */
	, dump = require('./dump')
	, diff = require('./diff')
	, sync = require('./sync')
	;

function Connection(options) {
	this._conn = mysql.createConnection(options);
	[ dump, diff, sync ].forEach(fn => {
		this[ fn.name ] = papply(fn, this._conn);
	});
}

Connection.prototype.destroy = function() {
	this._conn.destroy();	
};

module.exports = { 
	Connection, 
	diff, 
	dump, 
	sync,
};