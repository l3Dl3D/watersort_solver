let solveGame = (() => {
    function shuffleArray(array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
    }
    
    let bottles = [...document.getElementsByClassName('bottle')].map((bottle) => {
        let waters = [...bottle.getElementsByClassName('water')].map((water) => {
            return {
                color: water.style['background-color'],
                height: +water.style['height'].replace('em', ''),
            };
        });
        let size = waters
        .map((water) => {return water.height})
        .reduce((a, b) => {return a + b}, 0);
        return {waters, size};
    });

    function getLastWater(bottle) {
        return bottle.waters[bottle.waters.length - 1];
    };

    const MAX_SIZE = 20;

    class Board {
        constructor(bottles) {
            this.bottles = bottles;
        }

        toString() {
            return JSON.stringify(this.bottles);
        }
        
        *getMoves() {
            // source iterate
            for(let i = this.bottles.length - 1; i >= 0; i--) {
                // dest iterate
                for(let j = 0; j < this.bottles.length; j++) {
                    if(i == j) continue; // skip same bottle
                    const src = this.bottles[i];
                    const dst = this.bottles[j];
                    
                    // if source bottle is empty then skip
                    if(src.waters.length == 0) continue;
                    
                    // if dst bottle is empty then a valid move can be
                    // iff src bottle has 2 colors or more.
                    if(dst.waters.length == 0) {
                        if(src.waters.length >= 2) {
                            yield {i, j};
                        }
                        continue;
                    }
                    
                    // full bottle
                    if(dst.size >= MAX_SIZE) {
                        continue;
                    }
                    
                    // check if dst last color matches src last color
                    // and check if there's enough space
                    const srcLastWater = getLastWater(src);
                    const dstLastWater = getLastWater(dst);
                    if((srcLastWater.color == dstLastWater.color)
                    && (dst.size + srcLastWater.height <= MAX_SIZE)) {
                        yield {i, j};
                        continue;
                    }
                }
            }
        }
        
        playMove(move) {
            let src = this.bottles[move.i];
            let dst = this.bottles[move.j];
            if(dst.waters.length == 0) {
                let water = src.waters.pop();
                src.size -= water.height;
                dst.waters.push(water);
                dst.size += water.height;
            } else {
                let water1 = src.waters.pop();
                let water2 = dst.waters.pop();
                src.size -= water1.height;
                dst.size -= water2.height;
                
                if((src.size < 0) || (dst.size < 0)) {
                    noexist();
                }
                
                // merge waters
                dst.waters.push({
                    color: water1.color,
                    height: water1.height + water2.height,
                });
                dst.size += water1.height + water2.height;
            }
        }
        
        isWin() {
            const res = this.bottles.every((bottle) => {
                return (bottle.waters.length < 2) && (bottle.size == 0 || bottle.size == MAX_SIZE);
            });
            
            return res;
        }
        
        countEmpty() {
            return this.bottles.map((bottle) => {
                return +(bottle.waters.length == 0);
            }).reduce((a, b) => {return a + b});
        }
        
        createBoardFromMove(move) {
            let board = new Board(JSON.parse(this.toString()));
            board.playMove(move);
            return board;
        }
    };
    
    class Game {
        constructor(board) {
            this.board = board;
            // boards without solution
            this.noSolution = new Set()
        }
        
        solve(r) {
            if(r == 0) return null; // recursion too high, quit
            
            // if board is in cache then return null
            if(this.noSolution.has(this.board.toString()))
                return null;
            
            const moves = [...this.board.getMoves()];
            shuffleArray(moves); // seems to speed things up sometimes!
            moves.sort((move) => {return this.board.createBoardFromMove(move).countEmpty()});
            
            for(const move of moves) {
                const boardJSON = this.board.toString();
                
                // console.log(`${r}: in move`, move);
                this.board.playMove(move);
                if(this.board.isWin()) {
                    return [move];
                }
                
                let winMoves = this.solve(r - 1);
                if(winMoves != null) {
                    return [move].concat(winMoves);
                }
                
                this.board = new Board(JSON.parse(boardJSON));
            }
            
            // there is no solution for this board so remember it
            this.noSolution.add(this.board.toString());
            return null;
        }
    }
    
    let game = new Game(new Board(bottles));
    let moves = game.solve(350);
    if(moves == null) {
        console.log('no solution!!!');
    } else {
        const MOVE_TIME = 50;
        const GAME_DELAY = 75;
        
        console.log('solved', moves);
        const bottlesHTML = [...document.getElementsByClassName('bottle')];
        for(const i in moves) {
            setTimeout(() => {bottlesHTML[moves[i].i].click()}, i * MOVE_TIME);
            setTimeout(() => {bottlesHTML[moves[i].j].click()}, i * MOVE_TIME + MOVE_TIME / 2);
        }
        setTimeout('solveGame()', moves.length * MOVE_TIME + GAME_DELAY)
    }
});

solveGame();

