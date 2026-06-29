import { watchFile, unwatchFile } from 'fs';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

global.pairingNumber = your-number;
global.owner = [['2347047504860', 'ElitePro', true]];
global.mods = [];

global.namebot = 'ELITE-PRO-V2';
global.author = 'cyrilix';

global.prefix = '.';
global.wait = 'Loading...';
global.eror = 'An error occurred...';

global.pakasir = {
	slug: 'kilersbotz',
	apikey: 'bWDO2M8GcfruzXscdKNQJC3vw8Y8PV13',
	expired: 30, // 1 = 1 minute, 30 = 30 minutes
};

global.stickpack = 'Created By';
global.stickauth = namebot;

let file = fileURLToPath(import.meta.url);
watchFile(file, () => {
	unwatchFile(file);
	console.log(chalk.redBright("Update 'config.js'"));
	import(`${file}?update=${Date.now()}`);
});
