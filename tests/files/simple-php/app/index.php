<?php
echo "hello world<br>\n";

array_walk($_ENV, function ($value, $key) {
  echo "$key=$value<br>\n";
});

phpinfo();