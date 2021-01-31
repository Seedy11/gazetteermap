<?php

	$executionStartTime = microtime(true) / 1000;

	$t_url='http://api.openweathermap.org/data/2.5/weather?lat=%s&lon=%s&appid=%s&units=metric';
	$url = sprintf($t_url, $_REQUEST['lat'], $_REQUEST['lng'], "c2edf172f20d894823f5043ab303b15f");
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_URL,$url);

	$result=curl_exec($ch);

	curl_close($ch);

	$decode = json_decode($result,true);

	$output['status']['code'] = "200";
	$output['status']['name'] = "ok";
	$output['status']['description'] = "mission saved";
	$output['status']['returnedIn'] = (microtime(true) - $executionStartTime) / 1000 . " ms";
	$output['data'] = $decode;

	header('Content-Type: application/json; charset=UTF-8');

	echo json_encode($output);

?>
