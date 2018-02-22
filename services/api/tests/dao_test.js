const sshpk = require('sshpk');
const fs = require('fs');

const toFingerprint = sshKey =>
  sshpk
    .parseKey(sshKey, 'ssh')
    .fingerprint()
    .toString();

const main = async () => {
  const MariaSQL = require('mariasql');
  const Dao = require('../src/dao');

  const sqlClient = new MariaSQL({
    host: 'localhost',
    port: 3306,
    user: 'api',
    password: 'api',
    db: 'infrastructure',
  });

  const dao = Dao.make(sqlClient);
  const cred = { role: 'admin' };

  const ret = await dao.getCustomerSshKeys(cred);
  try {
  const priv = fs.readFileSync('../lagoon_test', 'utf8');
  } catch(e) {
    console.error('No `../lagoon_test` file found. It should contain the ssh private key for testing');
    process.exit(1);
  }

  const foo = sshpk.parsePrivateKey(priv, 'ssh');
  console.log('FIRST FINGERPRINT:');
  console.log(foo.fingerprint().toString());
  console.log('SECOND FINTERPRINT:');
  console.log(foo.toPublic().fingerprint().toString());
  console.log('OTHER:');
  console.log(ret[0]);


  const key = ret[0];

  const myKey =
    'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQCxA/y/cHF1pxxaMMFysOKvbZuAAkOGXX+QMPZZ083zf53nSD6Wzy8D3uEBVX0NzE1H19FJGtTSHYXI/Fo57Hvy6NLqHl0n9lpTUzP8yciKFOQsIOsRpCUp9OQbrIFGmBuj1m/Jz2HMD8IUkgw4H8cQzBnlwHr73b0jcMts9eToBdHWpGOgWdUTr0VUri4A/zSAnLoZvfpMATh/gn3bekxwus+JTaHy6MBlyYHIs5tu5morcsTJj9nGiw5CEjcktWIi11kB3GPQWsord0BJgzl7PAsP3wYvp2OjQgJMrOCmVZQhphYl05skZCbQwlDw8bv9aDSeVDN40iIfxBSmYCMdeVTWndUAPoPiIEWXHbeglaxUlMhoVWKu35ctUu/bw75jJNCwnm1nGR6BQR4j921Grq0fpawRwcL3wGRM2vrjW9os1qVX5cVyj3XkoYw2kXEHDzMBDsUebpsufc3LPMuAdEpC1gAbxO0R1KHFcNjxJV7gb9Hv6wrDptSUevaOq64UpexiqG7cOOX91SSsPw7veTpaLT3mh2HTIOWJxfD59/APf1Ygfk6m6+fWx7sziPApFFVumeyXNRI43ihNGihHQRMbaLgcQr340UullXBG1Zb7r7BNwEC04MU4AGWkKtu9vOxZlk0t7cM4lQtu/vnpTmd2tnLMOkCtxXX6BGqmfw== p.stapfer@gmail.com';

  const fingerprint = toFingerprint(key);
  console.log(fingerprint);

  sqlClient.end();
};

main();
