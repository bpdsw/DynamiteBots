/*

TODO
- Learn and account for opponent's biases

# Assumptions
- Opponent is frequency biased and this does not depend on gamestate

 */
enum Moves {
	Rock = "R",
	Paper = "P",
	Scissors = "S",
	Dynamite = "D",
	Waterbomb = "W"
}

class Bot {
	gamestate: Gamestate;
	initialDynamites = 100;
	winningScore = 1000;
	maxRounds = 2500;
	players: Array<Player>;
	rounds = 0;
	draws = 0;
	unbiasedOpponentPredictions = new RPSDWArray();
	
	get opponentBias():RPSDWArray {
		return this.opponentFrequency.dividedBy(this.unbiasedOpponentPredictions)
	}
	
	get opponentFrequency(): RPSDWArray {
		let freqs = new RPSDWArray();
		for (const round of this.gamestate.rounds) {
			freqs.setValueForMove(round.p2, freqs.valueForMove(round.p2) + 1)
		}
		return freqs;
	}
	
	
	static allMoves = [Moves.Rock, Moves.Paper, Moves.Scissors, Moves.Dynamite, Moves.Waterbomb];
	static depth = 10;
	
	constructor() {
		this.players = [];
		this.players[0] = new Player(1, this);
		this.players[1] = new Player(2, this);
	}
	
	makeMove(gamestate: Gamestate): Moves {
		this.gamestate = gamestate;
		if (gamestate.rounds.length !== 0) {
			const round = gamestate.rounds[gamestate.rounds.length - 1]
			
			this.player(1).addRound(round);
			this.player(2).addRound(round);
			if (round.p1 === round.p2) {
				this.draws++;
			}
			this.rounds++;
		}
		
		let moves = [Moves.Rock];
		let maxMoveValue = -1;
		
		const opponentPredictions = this.them.valuesOfAllMoves(Bot.depth)
		this.unbiasedOpponentPredictions = RPSDWArray.add(this.unbiasedOpponentPredictions, opponentPredictions)
		
		//console.log(this.opponentBias)
		
		let valuesForMe: RPSDWArray;
		if (this.rounds < 50) {
			valuesForMe = this.me.valuesOfAllMoves(Bot.depth)
		} else {
			debugger
			valuesForMe = this.me.valuesOfAllMovesConsideringOpponentBias(Bot.depth)
		}
		
		if (isNaN(valuesForMe.rock)) {
			throw "NaN"
		}
		
		for (const move of Bot.allMoves) {
			const thisMoveValue = valuesForMe.valueForMove(move);
			if (thisMoveValue === maxMoveValue) {
				moves.push(move);
			} else if (thisMoveValue > maxMoveValue) {
				moves = [move];
				maxMoveValue = thisMoveValue;
			}
		}
		
		const choice = Math.floor(Math.random() * moves.length);
		console.log(moves[choice])
		console.log("\n-----\n")
		return moves[choice]
	}
	
	get estimatedRoundsLeft(): number {
		let fractionWon: number;
		const winningPlayer = this.me.wins > this.them.wins ? 1 : 2;
		const winningScore = this.player(winningPlayer).wins
		if (this.gamestate.rounds.length < 10) {
			fractionWon = 0.5
		} else {
			fractionWon = winningScore / (this.rounds);
		}
		const estRL = (this.winningScore - winningScore) * (1 / fractionWon);
		return Math.min(estRL, this.maxRounds - this.rounds)
	}
	

	static resultOfRound(round: Round): RoundResult {
		// returns 0 if neither player 1
		let p1wins = false;
		switch (round.p1) {
			case round.p2:
				return 0;
			case Moves.Rock:
				p1wins = round.p2 === Moves.Scissors || round.p2 === Moves.Waterbomb;
				break;
			case Moves.Paper:
				p1wins = round.p2 === Moves.Rock || round.p2 === Moves.Waterbomb;
				break;
			case Moves.Scissors:
				p1wins = round.p2 === Moves.Paper || round.p2 === Moves.Waterbomb;
				break;
			case Moves.Waterbomb:
				p1wins = round.p2 === Moves.Dynamite;
				break;
			case Moves.Dynamite:
				p1wins = round.p2 !== Moves.Waterbomb;
				break;
		}
		return p1wins ? 1 : 2;
		
	}
	
	get valueOfCurrentRound(): number {
		const gamestate = this.gamestate;
		const moves = gamestate.rounds.slice(0).reverse();
		let value = 1;
		for (const move of moves) {
			if (Bot.resultOfRound(move) === RoundResult.Draw) {
				value += 1;
			} else {
				break;
			}
		}
		return value;
	}
	
	player(number: number): Player {
		return this.players[number - 1]
	}
	
	get me(): Player {
		return this.player(1)
	}
	
	get them(): Player {
		return this.player(2)
	}
}

class Player {
	dynamitesLeft: number;
	wins = 0;
	aggression = 1;
	
	constructor(public number: number, public parent: Bot) {
		this.dynamitesLeft = parent.initialDynamites
	}
	
	addRound(round: Round): void {
		if ((this.number === 1 ? round.p1 : round.p2) === Moves.Dynamite) {
			this.dynamitesLeft -= 1;
		}
		if (Bot.resultOfRound(round) === this.number) {
			this.wins++;
		}
	}
	
	get opponent() {
		return this.parent.player(this.number === 1 ? 2 : 1);
	}
	
	biasedOpponentPredictions(depth: number): RPSDWArray {
		const opponentValues = this.opponent.valuesOfAllMoves(depth);
		const opponentBias = this.parent.opponentBias;
		const biasedValues = opponentValues.times(opponentBias);
		console.log(`VALUES:  ${JSON.stringify(opponentValues, null, '\t')}`);
		console.log('BIAS: ' + JSON.stringify(opponentBias,null, '\t'));
		console.log('PRODUCT: ' + JSON.stringify(biasedValues,null, '\t'));
		console.log('NORMALIZATION: ' + JSON.stringify(biasedValues.normalizedCopy(),null, '\t'));
		return biasedValues.normalizedCopy()
	}
	
	valuesOfAllMovesGivenOpponentValues(opponentValues: RPSDWArray): RPSDWArray {
		let values = new RPSDWArray();
		for (const move of Bot.allMoves) {
			switch (move) {
				case Moves.Rock:
				case Moves.Paper:
				case Moves.Scissors:
				case Moves.Waterbomb:
					const moveObject = new Move(move);
					const tryToWin = moveObject.beats
						.map(m => opponentValues.valueForMove(m))
						.reduce((a,b) => a + b);
					const tryNotToLose = moveObject.isBeatenBy
						.map(m => opponentValues.valueForMove(m))
						.reduce((a,b) => a + b) + 1;
					values.setValueForMove(move,(2**this.aggression) * tryToWin / tryNotToLose);
					break;
				case Moves.Dynamite:
					const tryToWinD = moveObject.beats
						.map(m => opponentValues.valueForMove(m))
						.reduce((a,b) => a + b);
					const tryNotToLoseD = moveObject.isBeatenBy
						.map(m => opponentValues.valueForMove(m))
						.reduce((a,b) => a + b) + 1;
					const basicValue = (2**this.aggression) * tryToWinD / tryNotToLoseD;
					values.setValueForMove(move,basicValue * this.dynamiteScarcity * this.parent.valueOfCurrentRound);
					break;
			}
		}
		return values.normalizedCopy();
	}
	
	valuesOfAllMoves(depth: number): RPSDWArray {
		let opponentValues;
		if (depth < 0) {
			opponentValues = new RPSDWArray(2,2,2,3,1)
		} else {
			opponentValues = this.opponent.valuesOfAllMoves(depth - 1)
		}
		return this.valuesOfAllMovesGivenOpponentValues(opponentValues)
	}
	
	valuesOfAllMovesConsideringOpponentBias(depth: number): RPSDWArray {
		return this.valuesOfAllMovesGivenOpponentValues(this.biasedOpponentPredictions(depth))
	}
	
	get dynamiteScarcity(): number {
		return this.dynamitesLeft / this.parent.estimatedRoundsLeft
	}
}

interface Round {
	p1: Moves,
	p2: Moves
}

interface Gamestate {
	rounds: Array<Round>
}



class Move {
	constructor(public value: Moves) {
	
	}
	get beats(): Array<Moves> {
		switch (this.value) {
			case Moves.Rock:
				return [Moves.Scissors, Moves.Waterbomb];
			case Moves.Scissors:
				return [Moves.Paper, Moves.Waterbomb];
			case Moves.Paper:
				return [Moves.Rock, Moves.Waterbomb];
			case Moves.Dynamite:
				return [Moves.Rock, Moves.Paper, Moves.Scissors]
			case Moves.Waterbomb:
				return [Moves.Dynamite]
		}
	}
	
	get isBeatenBy(): Array<Moves> {
		switch (this.value) {
			case Moves.Rock:
				return [Moves.Paper, Moves.Dynamite];
			case Moves.Scissors:
				return [Moves.Rock, Moves.Dynamite];
			case Moves.Paper:
				return [Moves.Scissors, Moves.Dynamite];
			case Moves.Dynamite:
				return [Moves.Waterbomb]
			case Moves.Waterbomb:
				return [Moves.Rock, Moves.Paper, Moves.Scissors]
		}
	}
	
	get baseValue(): number {
		return this.beats.length;
	}
}

class RPSDWArray {
	constructor(public rock = 0,
				public paper = 0,
				public scissors = 0,
				public dynamite = 0,
				public waterbomb = 0) {
		
	}
	
	static add(a: RPSDWArray, b: RPSDWArray): RPSDWArray {
		return a.piecewise(b, (a,b) => a+b)
	}
	
	get sum(): number {
		return this.rock + this.paper + this.scissors + this.dynamite + this.waterbomb;
	}
	
	normalizedCopy(): RPSDWArray {
		return this.map(a => a / this.sum)
	}
	
	dividedBy(other: RPSDWArray): RPSDWArray {
		return this.piecewise(other, (a,b) => a/b)
	}
	
	valueForMove(move: Moves) {
		switch(move) {
			case Moves.Rock:
				return this.rock;
			case Moves.Paper:
				return this.paper;
			case Moves.Scissors:
				return this.scissors;
			case Moves.Dynamite:
				return this.dynamite;
			case Moves.Waterbomb:
				return this.waterbomb;
		}
	}
	
	setValueForMove(move: Moves, newValue: number) {
		switch(move) {
			case Moves.Rock:
				this.rock = newValue;
				break;
			case Moves.Paper:
				this.paper = newValue;
				break;
			case Moves.Scissors:
				this.scissors = newValue;
				break;
			case Moves.Dynamite:
				this.dynamite = newValue;
				break;
			case Moves.Waterbomb:
				this.waterbomb = newValue;
				break;
		}
	}
	
	map(fnToApply: (m: number) => number): RPSDWArray {
		return new RPSDWArray(
			fnToApply(this.rock),
			fnToApply(this.paper),
			fnToApply(this.scissors),
			fnToApply(this.dynamite),
			fnToApply(this.waterbomb)
		)
	}
	
	piecewise(other: RPSDWArray, fnToApply: (a:number, b:number)  => number): RPSDWArray {
		return new RPSDWArray(
			fnToApply(this.rock, other.rock),
			fnToApply(this.paper, other.paper),
			fnToApply(this.scissors, other.scissors),
			fnToApply(this.dynamite, other.dynamite),
			fnToApply(this.waterbomb, other.waterbomb)
		)
	}
	
	times(other: RPSDWArray): RPSDWArray {
		return this.piecewise(other, (a, b) => a*b)
	}
	
}

enum RoundResult {
	P1Wins = 1,
	P2Wins = 2,
	Draw = 0
}

export = new Bot()
