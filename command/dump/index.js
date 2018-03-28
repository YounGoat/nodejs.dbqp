'use strict';

const MODULE_REQUIRE = 1
	/* built-in */
	
	/* NPM */
	, commandos = require('commandos')
	, noda = require('noda')

	/* in-jinang */
	, cloneObject = require('jinang/cloneObject')
	, JsonFile = require('jinang/JsonFile')
	
	/* in-package */
	, dbqp = noda.inRequire('mysql')
	;

function help() {
	console.log(noda.nextRead('help.txt', 'utf8'));
}

function dump(connectOptions, database, output) {
	let conn = new dbqp.Connection(connectOptions);
	conn.dump(database, (err, metaJson) => {
		conn.destroy();
		if (err) {
			console.error(err.message);
		}
		else if (output) {
			let f = new JsonFile(output);
			f.json = metaJson;
			f.save();
			console.log(`database schema has been dumped into: ${output}`);
		}
		else {
			console.log(JSON.stringify(metaJson, null, 4));
		}
	});
}

function run(argv) {
	const groups = [ 
		[ 
			'--help -h [*:=*help] REQUIRED', 
		],
		[
			'--host -h NOT NULL',
			'--port -p NOT NULL',
			'--user -u NOT NULL',
			'--password -P NOT NULL',
			'--database -d [0] NOT NULL REQUIRED',
			'--output -o NOT NULL',
		],
	];

	const cmd = commandos.parse.onlyArgs(argv, { groups, catcher: help });

	if (!cmd) {
		return;
	}
	else if (cmd.help) {
		return help();
	}
	else {
		let connectOptions = Object.assign({
			host: 'localhost',
			port: 3306,
		}, cloneObject(cmd, [ 'host', 'port', 'user', 'password' ]));
		return dump(connectOptions, cmd.database, cmd.output);
	}
}

run.desc = 'Dump schema information from database.';

module.exports = run;