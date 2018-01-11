/*

TODO
- Learn and account for opponent's biases
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
	players: Array<Player>
	rounds = 0;
	draws = 0;
	
	static allMoves = [Moves.Rock, Moves.Paper, Moves.Scissors, Moves.Dynamite, Moves.Waterbomb];
	
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
		
		
		for (const move of Bot.allMoves) {
			const thisMoveValue = this.me.valueOfMove(move, 4);
			if (thisMoveValue === maxMoveValue) {
				moves.push(move);
			} else if (thisMoveValue > maxMoveValue) {
				moves = [move];
				maxMoveValue = thisMoveValue;
			}
		}
		
		
		const choice = Math.floor(Math.random() * moves.length);
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
	aggression = 0;
	
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
	
	valueOfMove(move: Moves, depth: number, currentDepth = 0): number {
		if (currentDepth >= depth) {
			return new Move(move).baseValue;
		}
		switch (move) {
			case Moves.Rock:
			case Moves.Paper:
			case Moves.Scissors:
			case Moves.Waterbomb:
				const moveObject = new Move(move)
				const tryToWin = moveObject.beats
					.map(m => this.opponent.valueOfMove(m, depth, currentDepth + 1))
					.reduce((a,b) => a + b)
				const tryNotToLose = moveObject.isBeatenBy
					.map(m => this.opponent.valueOfMove(m, depth, currentDepth + 1))
					.reduce((a,b) => a + b);
				return this.aggression * tryToWin - tryNotToLose / this.aggression;
			case Moves.Dynamite:
				const tryToWinD = moveObject.beats
					.map(m => this.opponent.valueOfMove(m, depth, currentDepth + 1))
					.reduce((a,b) => a + b)
				const tryNotToLoseD = moveObject.isBeatenBy
					.map(m => this.opponent.valueOfMove(m, depth, currentDepth + 1))
					.reduce((a,b) => a + b);
				const basicValue = this.aggression * tryToWin - tryNotToLose / this.aggression;
				return basicValue * this.dynamiteScarcity * this.parent.valueOfCurrentRound;
		}
		
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


enum RoundResult {
	P1Wins = 1,
	P2Wins = 2,
	Draw = 0
}

export = new Bot()
