'use strict';

const MODULE_REQUIRE = 1
	/* built-in */
	, fs = require('fs')
	
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

function diff(connectOptions, referer, referee, output) {
	let conn = new dbqp.Connection(connectOptions);
	conn.diff(referer, referee, (err, metaJson) => {
		conn.destroy();
		if (err) {
			console.error(err.message);
		}
		else if (output) {
			let f = new JsonFile(output);
			f.json = metaJson;
			f.save();
			console.log(`schema difference between two databases has been dumped into: ${output}`);
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
			'--referer --referer-database -r [0] NOT NULL REQUIRED',
			'--referee --referee-database -R [1] NOT NULL REQUIRED',
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

		let { referer, referee } = cmd;
		let verifyDatabase = dbname => {
			if (dbname.endsWith('.json')) {
				try {
					dbname = JSON.parse(fs.readFileSync(dbname, 'utf8'));
				} catch(ex) {
					console.log(ex);
					console.log(`failed to load schema meta from: ${dbname}`);
				}
			}
			return dbname;
		};
		referer = verifyDatabase(referer);
		referee = verifyDatabase(referee);

		return diff(connectOptions, referer, referee, cmd.output);
	}
}

run.desc = 'Generate SQLs to make two databases consistent.';

module.exports = run;