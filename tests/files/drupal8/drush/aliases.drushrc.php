<?php
// Don't change anything here, it's magic!

// For CI: allow to completely disable amazee.io alias loading
if (getenv('AMAZEEIO_DISABLE_ALIASES')) {
  drush_log('AMAZEEIO_DISABLE_ALIASES is set, bailing out of loading amazeeio aliases');
  return;
}

// global $aliases_stub;
// if (empty($aliases_stub)) {
//     $ch = curl_init();
//     curl_setopt($ch, CURLOPT_AUTOREFERER, TRUE);
//     curl_setopt($ch, CURLOPT_HEADER, 0);
//     curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
//     curl_setopt($ch, CURLOPT_URL, 'https://drush-alias.amazeeio.cloud/aliases.drushrc.php.stub');
//     curl_setopt($ch, CURLOPT_FOLLOWLOCATION, TRUE);
//     $aliases_stub = curl_exec($ch);
//     curl_close($ch);
// }
// eval($aliases_stub);
