const bot = require('./BenjaminOne');

const gamestate = {rounds: []};
// ["R", "P", "S", "D", "W"].forEach(move => {
// 	for(var i = 0; i < 10; i++) {
// 	gamestate.rounds.push({p1: move, p2: move})
// }
// });
// gamestate.rounds.push({p1: "R", p2: "R"})
// gamestate.rounds.push({p1: "R", p2: "P"})
// gamestate.rounds.push({p1: "R", p2: "P"})
// gamestate.rounds.push({p1: "R", p2: "P"})
// gamestate.rounds.push({p1: "P", p2: "P"})
// gamestate.rounds.push({p1: "P", p2: "P"})
// gamestate.rounds.push({p1: "S", p2: "S"})
// gamestate.rounds.push({p1: "S", p2: "S"})
// gamestate.rounds.push({p1: "S", p2: "S"})
// gamestate.rounds.push({p1: "D", p2: "D"})
console.log(bot.makeMove(gamestate));