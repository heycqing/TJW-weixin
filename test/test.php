<?php
$openId = isset($_POST['openId']) ? htmlspecialchars($_POST['openId']) : '';
// $url = isset($_POST['url']) ? htmlspecialchars($_POST['url']) : '';
echo '网站名: ' . $openId;
echo "\n";

?>