<?php
global $aliases_stub;
if (empty($aliases_stub)) {
  $aliases_stub = file_get_contents("/etc/drush/aliases.drushrc.php.stub");
}
eval($aliases_stub);