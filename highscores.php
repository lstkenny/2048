<?php

$scores = json_decode(file_get_contents('highscores.json'), true);

$ip = $_SERVER['REMOTE_ADDR'];

if (!isset($scores[$ip]))
{
	$scores[$ip] = array('highscore' => 0);
}

if (isset($_REQUEST['score']))
{
	$score = intval($_REQUEST['score']);
	if ($score > $scores[$ip]['highscore'])
	{
		$scores[$ip]['highscore'] = $score;
		file_put_contents('highscores.json', json_encode($scores));
	}
}
echo json_encode($scores[$ip]);