'use strict';

const MODULE_REQUIRE = 1
	/* built-in */
	
	/* NPM */
	, colors = require('colors')
	, co = require('jinang/co')
	
	/* in-package */
	, diff = require('./diff')
	, parseConnection = require('./inc/parseConnection')
	, promiseQuery = require('./inc/promiseQuery')
	;


/**
 * Make database referer to keep pace with database referee in skeletons.
 * @param  {Connection} conn
 * @param  {string}     referer  - Referer database name
 * @param  {string}     referee  - Referee database name
 * @param  {Object}     referee  - Referer database meta (JSON)
 * @param  {boolean}    force    - ingore errors
 * @param  {Function}   callback
 * @return {string[]}
 */
function sync(conn, referer, referee, force, callback) { return co(function*() {
	conn = parseConnection(conn);

	if (typeof force == 'function') {
		callback = force;
		force = false;		
	}

	let SQLs = yield diff(conn, referer, referee);

	yield function(done) {
		conn.changeUser({ database: referer }, done);
	};

	for (let i = 0; i < SQLs.length; i++) {
		if (force) {
			yield done => {
				promiseQuery(conn, SQLs[i])
					.then(() => done())
					.catch(ex => {
						console.warn(colors.yellow('failed to execute SQL:'));
						console.warn(colors.bold(SQLs[i]));
						console.warn(colors.red(ex.message));
						done();
					});
			}
		}
		else {
			yield promiseQuery(conn, SQLs[i]);
		}			
	}

}, callback); }

module.exports = sync;