'use strict';

const MODULE_REQUIRE = 1
	/* built-in */
	
	/* NPM */
	, noda = require('noda')
	
	/* in-package */
	;

/**
 * Command entrance.
 * @param  {string[]}  argv          command line arguments
 * @param  {Object}    options    
 * @param  {string[]}  options.names command and sub command names
 */
function man(argv, options) {
	let commandName = options.names.join(' ');

	let commandBaseDir = 'command';
	for (let i = 1; i < options.names.length; i++) {
		commandBaseDir = `${commandBaseDir}/${options.names[i]}/command`;
	}

	let subcommand = null;
	if (argv.length && !argv[0].startsWith('-')) {
		subcommand = argv.shift();
	}

	// Subcommand "help" is a virtual one.
	if (subcommand == 'help') {
		subcommand = argv[0];
		argv[0] = 'help';
	}

	if (subcommand) {
		let commandName = null;
		if (noda.inExists(`${commandBaseDir}/${subcommand}`, true)) {
			commandName = subcommand;
		}
		else {
			let names = noda.inReaddir(commandBaseDir);
			names = names.filter(name => name.startsWith(subcommand));
			if (names.length > 1) {
				console.error(`Command name "${subcommand}" is ambiguous while multiple commands "${names.join(', ')}" exist.`);
			}
			else if (names.length == 1) {
				commandName = names[0];
			}
			else {
				console.error(`sub command not found: ${subcommand}`);	
			}
		}

		if (commandName) {
			noda.inRequire(`${commandBaseDir}/${commandName}`)(argv);
		}
	}
	else {
		let subcommands = [ { name: 'help <sub-command-name>', desc: 'Show help info of specified sub command.' } ];
		noda.inReaddir(commandBaseDir).forEach((name) => {
			name = name.replace(/\.js$/, '');
			let run = null, desc;
			try {
				run = noda.inRequire(`${commandBaseDir}/${name}`);
				subcommands.push({ name, desc: run.desc });
			} catch (error) {
				// DO NOTHING.
				// Ignore invalid directory/file.
			}
		});


		console.log();
		console.log('NAME');
		console.log(`    ${commandName} - ${options.desc}`);
		console.log();
		console.log('SYNOPSIS');
		subcommands.forEach(cmd => {
			console.log(`    ${commandName} ${cmd.name}`);
			if (cmd.desc) {
				console.log(`    ${cmd.desc}`);
			}
			console.log();
		});

		if (options.alias && options.alias.length > 0) {
			console.log();
			console.log('ALIAS');
			options.alias.forEach(couple => {
				console.log(`    ${commandName} ${couple[0].join(' ')} = ${commandName} ${couple[1].join(' ')}`);
			});
			console.log();
		}
	}
}

module.exports = man;