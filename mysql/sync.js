'use strict';

const MODULE_REQUIRE = 1
	/* built-in */
	
	/* NPM */
	, co = require('jinang/co')
	
	/* in-package */
	, diff = require('./diff')
	, promiseQuery = require('./inc/promiseQuery')
	;


/**
 * Make database referer to keep pace with database referee in skeletons.
 * @param  {Connection} conn
 * @param  {string}     referer  - Referer database name
 * @param  {string}     referee  - Referee database name
 * @param  {Object}     referee  - Referer database meta (JSON)
 * @param  {Function}   callback
 * @return {string[]}
 */
function sync(conn, referer, referee, callback) { return co(function*() {
	let SQLs = yield diff(conn, referer, referee);

	yield function(done) {
		conn.changeUser({ database: referer }, done);
	};

	for (let i = 0; i < SQLs.length; i++) {
		yield promiseQuery(conn, SQLs[i]);
	}

}, callback); }

module.exports = sync;