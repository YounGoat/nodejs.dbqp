'use strict';

const MODULE_REQUIRE = 1
	/* built-in */
	, fs = require('fs')
	
	/* NPM */
	
	/* in-package */
	, dbqp = require('../mysql')
	;

const conn = new dbqp.Connection({
	host     : 'localhost',
	user     : 'root',
	password : '',
});

conn.sync('democopy', 'demo', (error, data) => {
	console.log('-- CALLBACK --');
	if (error ) console.log('error', error);
	else {
		console.log('OK');		
	}
	conn.destroy();
});
	
// conn.diff('iconfont', 'yicon_1_2_1', (error, data) => {
// 	console.log('-- CALLBACK --');
// 	if (error ) console.log('error', error);
// 	else {
// 		console.log('SQLs');
// 		console.log(data);
// 	}
// 	conn.destroy();
// });

// conn.dump('demo', (err, data) => {
// 	if (err) {
// 		console.log('--- ERROR ---')
// 		console.log(err);
// 		return;
// 	}
// 	fs.writeFileSync('./example/demo.json', JSON.stringify(data, null, '  '));
// 	conn.destroy();
// });