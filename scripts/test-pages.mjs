// Release gates for the scanner-only, remote-grading Pages client.
import {spawnSync} from 'node:child_process';
for (const test of ['local-storage.cjs','remote-client.cjs','voice.cjs','student-import.cjs','question-files.cjs']) {
 const result=spawnSync(process.execPath,['tests/'+test],{stdio:'inherit'});
 if(result.status!==0)process.exit(result.status||1);
}
