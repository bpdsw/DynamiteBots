const { exec } = require('child_process');

var results = []

exec(' node dynamite/dynamite-cli.js BenjaminOne.js BenjaminOne.js', (err, stdout, stderr) => {
	if (err) {
		// node couldn't execute the command
		return;
	}

	// the *entire* stdout and stderr (buffered)
	results.append(results)
});

while (results.length < 100) {
	continue
}




function parseResult(result) {
	const resultLines = result.split("\n");
	const scoreStrings = resultLines[2].split(",")
	const p1Score = scoreStrings[0].substr(12)
	const p2Score = scoreStrings[1].substr(4, scoreStrings[1].length - 5)
	return {
		p1Score: p1Score,
		p2Score: p2Score
	}
}

function addResults(a, b) {
	return {
		p1Score: a.p1Score + b.p1Score,
		p2Score: a.p2Score + b.p2Score
	}
}