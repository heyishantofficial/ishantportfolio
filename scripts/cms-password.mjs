// Makes the CMS_PASSWORD_HASH setting, so you can log in to /admin with a password
// you can remember (the media key always works too).
//
//   npm run cms:password
//
// Type the password twice. Paste the printed line into Dokploy as the environment
// variable CMS_PASSWORD_HASH and redeploy. Only the hash leaves this computer: the
// password itself can't be worked out from it. Use a long one (four or five words).

import crypto from 'node:crypto';
import readline from 'node:readline';

function ask(question) {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY) {
      let data = '';
      process.stdin.on('data', (d) => (data += d));
      process.stdin.on('end', () => resolve(data.split('\n')[0]));
      return;
    }
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    // Hide what's typed.
    rl._writeToOutput = (s) => rl.output.write(s.includes(question) ? s : '');
    rl.question(question, (answer) => {
      rl.output.write('\n');
      rl.close();
      resolve(answer);
    });
  });
}

const password = await ask('New CMS password: ');
if (process.stdin.isTTY && (await ask('Same again: ')) !== password) {
  console.error('They don’t match. Nothing was made.');
  process.exit(1);
}
if (password.length < 12) {
  console.error('Use at least 12 characters (a few words works well).');
  process.exit(1);
}

const N = 16384;
const r = 8;
const p = 1;
const salt = crypto.randomBytes(16);
const hash = crypto.scryptSync(password, salt, 32, { N, r, p });
console.log('\nPut this in Dokploy as CMS_PASSWORD_HASH, then redeploy:\n');
console.log(`scrypt$${N}$${r}$${p}$${salt.toString('hex')}$${hash.toString('hex')}`);
