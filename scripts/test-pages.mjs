// Release gates for the scanner-only, remote-grading Pages client.
import {spawnSync} from 'node:child_process';
for (const test of ['local-storage.cjs','remote-client.cjs','durable-client.cjs','voice.cjs','student-import.cjs','question-files.cjs','subscriber-password.cjs','owner-messages.cjs','bulk-admin.cjs']) {
 const result=spawnSync(process.execPath,['tests/'+test],{stdio:'inherit'});
 if(result.status!==0)process.exit(result.status||1);
}

{ const result=spawnSync(process.execPath,['tests/tab-session.mjs'],{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1); }
