<?php

$scores = json_decode(file_get_contents('highscores.json'), true);
$score = intval($_REQUEST['score']);

if ($score > $scores['highscore'])
{
	$scores['highscore'] = $score;
	file_put_contents('highscores.json', json_encode($scores));
}

echo json_encode($scores);