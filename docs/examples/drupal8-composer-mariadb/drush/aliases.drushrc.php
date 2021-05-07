<?php
/**
 * @file
 * Don't change anything here, it's magic!
 */

$aliasUrl = "https://drush-alias.lagoon.amazeeio.cloud/aliases.drushrc.php.stub";
$aliasCheckTimeout = 5;

//do a head check against the alias stub file, report on failure
$chead = curl_init();
curl_setopt($chead, CURLOPT_URL, $aliasUrl);
curl_setopt($chead, CURLOPT_NOBODY, true);
curl_setopt($chead, CURLOPT_CONNECTTIMEOUT, $aliasCheckTimeout);
curl_setopt($chead, CURLOPT_TIMEOUT, $aliasCheckTimeout); // curl giveup timeout
if(TRUE === curl_exec($chead)){
  $retcode = curl_getinfo($chead, CURLINFO_HTTP_CODE);
  if($retcode === 200){
    global $aliases_stub;
    if (empty($aliases_stub)) {
      $ch = curl_init();
      curl_setopt($ch, CURLOPT_AUTOREFERER, TRUE);
      curl_setopt($ch, CURLOPT_HEADER, 0);
      curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
      curl_setopt($ch, CURLOPT_URL, $aliasUrl);
      curl_setopt($ch, CURLOPT_FOLLOWLOCATION, TRUE);
      $aliases_stub = curl_exec($ch);
      curl_close($ch);
    }
    eval($aliases_stub);
  } else {
    echo "Unable to get remote aliases stub, you may be unable to access the requested resource".PHP_EOL;
  }
} else {
  echo "Unable to get remote aliases stub, you may be unable to access the requested resource".PHP_EOL;
}
curl_close($chead);