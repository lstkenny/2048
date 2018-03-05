class Grid 
{
	constructor(size)
	{
		this.matrix = this.setupMatrix(size);

		for (let i = 0; i < 2; i++)
		{
			this.addTile();
		}
	}

	checkMovesAvailable()
	{
		let size = this.matrix.length;

		for (let x = 0; x < size; x++)
		{
			for (let y = 0; y < size; y++)
			{
				if (this.matrix[x][y].val == 0 ||
					(x + 1 < size && this.matrix[x][y].val == this.matrix[x + 1][y].val) ||
					(y + 1 < size && this.matrix[x][y].val == this.matrix[x][y + 1].val))
				{
					return true;
				}
			}
		}
		return false;
	}

	setupMatrix(size)
	{
		let matrix = new Array(size);
		for (let x = 0; x < size; x++)
		{
			matrix[x] = new Array(size);
			for (let y = 0; y < size; y++)
			{
				let val = 2;//y < 3 ? 2 : 0;
				matrix[x][y] = {
					val: val,
					x: x,
					y: y
				}
			}
		}
		return matrix;
	}

	addTile()
	{
		let emptyTiles = new Array();
		for (let x = 0; x < this.matrix.length; x++)
		{
			for (let y = 0; y < this.matrix[x].length; y++)
			{
				if (this.matrix[x][y].val === 0)
				{
					emptyTiles.push({x: x, y: y});
				}
			}
		}
		if (emptyTiles.length == 0)
		{
			return false;
		}
		let cell = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
		cell.val = Math.random() > 0.5 ? 2 : 4;
		cell.new = true;
		this.matrix[cell.x][cell.y] = cell;

		return cell;
	}

	clone(object)
	{
		if (Array.isArray(object))
		{
			return JSON.parse(JSON.stringify(object));
		}
		else if (typeof object === "object")
		{
			return Object.assign({}, object);
		}
		return false;
	}

	cloneMatrix()
	{
		return this.clone(this.matrix);
	}

	transpose()
	{
		this.matrix = this.matrix[0].map((col, i) => this.matrix.map(row => row[i]));
	}

	rotate(times = 1)
	{
		for (let i = 0; i < times; i++)
		{
			this.matrix = this.matrix.reverse();
			this.transpose();
		}
	}

	concat(line)
	{
		for (let i = 0; i < line.length; i++)
		{
			if (line[i].val === 0)
			{
				continue;
			}
			for (let j = i + 1; j < line.length; j++)
			{
				if (line[j].val === 0)
				{
					continue;
				}
				if (line[j].val == line[i].val)
				{
					line[j].merged = this.clone(line[j]);
					line[j].mergedWith = this.clone(line[i]);
					line[i].val *= 2;
					line[j].val = 0;
					this.points += line[i].val;
				}
				break;
			}
		}
		return line;
	}

	move(line)
	{
		let size = line.length;

		for (let i = 1; i < size; i++)
		{
			if (line[i].val == 0)
			{
				continue;
			}
			for (let j = i; j > 0; j--)
			{
				if (line[j].val == 0)
				{
					continue;
				}
				if (line[j - 1].val > 0)
				{
					break;
				}
				let buff = line[j];
				line[j] = line[j - 1];
				line[j - 1] = buff;
			}
		}

		return line;
	}

	swipe(dir)
	{
		let angles = {
			'left': 0,
			'down': 1,
			'right': 2,
			'up': 3
		}
		let angle = angles[dir];

		this.points = 0;

		let matrix = this.cloneMatrix();

		this.rotate(angle);

		for (let i = 0; i < this.matrix.length; i++)
		{
			this.matrix[i] = this.concat(this.matrix[i]);
			this.matrix[i] = this.move(this.matrix[i]);
		}

		this.rotate(4 - angle);

		return this.changed(matrix, this.matrix);
	}
	dump(arr)
	{
		let res = [];
		for (let x = 0; x < arr.length; x++)
		{
			res[x] = [];
			for (let y = 0; y < arr.length; y++)
			{
				res[x][y] = arr[x][y].val;
			}
		}
		console.table(res);
	}

	changed(arr1, arr2)
	{
		for (let x = 0; x < arr1.length; x++)
		{
			for (let y = 0; y < arr1[x].length; y++)
			{
				if (arr1[x][y].val !== arr2[x][y].val)
				{
					return true;
				}
			}
		}
		return false;
	}

	getAnimMap(frames)
	{
		let animMap = [];
		for (let x = 0; x < this.matrix.length; x++)
		{
			for (let y = 0; y < this.matrix[x].length; y++)
			{
				if ((this.matrix[x][y].merged))
				{
					animMap.push({
						x: this.matrix[x][y].merged.x,
						y: this.matrix[x][y].merged.y,
						x0: this.matrix[x][y].mergedWith.x,
						y0: this.matrix[x][y].mergedWith.y,
						dx: (this.matrix[x][y].mergedWith.x - this.matrix[x][y].merged.x) / frames,
						dy: (this.matrix[x][y].mergedWith.y - this.matrix[x][y].merged.y) / frames,
						tile: this.matrix[x][y],
						merged: this.matrix[x][y].merged
					})
				}
				else if ((this.matrix[x][y].x && this.matrix[x][y].x != x) ||
					(this.matrix[x][y].y && this.matrix[x][y].y != y))
				{
					animMap.push({
						x: x,
						y: y,
						x0: this.matrix[x][y].x,
						y0: this.matrix[x][y].y,
						dx: (x - this.matrix[x][y].x) / frames,
						dy: (y - this.matrix[x][y].y) / frames,
						tile: this.matrix[x][y]
					});
				}
			}
		}

		return animMap;
	}

	updateMatrix()
	{
		for (let x = 0; x < this.matrix.length; x++)
		{
			for (let y = 0; y < this.matrix[x].length; y++)
			{
				if (!this.matrix[x][y].val)
				{
					this.matrix[x][y] = {x: x, y: y, val: 0};
				}
				else
				{
					let val = this.matrix[x][y].val;
					this.matrix[x][y] = {x: x, y: y, val: val};
				}
			}
		}
	}
}

class Game
{
	constructor(ctx)
	{
		fetch('./js/config.json')		
		.then(response => response.json())
		.then(config => {

			this.config = config;

			this.ctx = ctx;
			
			this.setupSize();

			this.setupControls();

			this.reset();
		});
	}

	setupSize()
	{
		//set grid size
		this.config.grid = {
			'margin': {
				'top': 150, //score + controls panel
				'right': 20, 
				'bottom': 20,
				'left': 20
			},
			'size': {}
		}

		this.config.grid.size = Math.min(
			this.ctx.canvas.clientWidth - this.config.grid.margin.right - this.config.grid.margin.left, 
			this.ctx.canvas.clientHeight - this.config.grid.margin.top - this.config.grid.margin.bottom, 
		);
		this.config.grid.margin.right = (this.ctx.canvas.clientWidth - this.config.grid.size) / 2;
		this.config.grid.margin.left = (this.ctx.canvas.clientWidth - this.config.grid.size) / 2;
		this.config.grid.margin.bottom = this.ctx.canvas.clientHeight - this.config.grid.size - this.config.grid.margin.top;

		//set tiles size
		this.config.tile = {}
		this.config.tile.size = this.config.grid.size / this.config.size;
		this.config.tile.margin = this.config.tile.size * 0.05;
	}

	setupControls()
	{
		this.controls = {};

		let self = this;

		//reset button
		this.addControl(
			'reset',
			{
				x: 20,
				y: 100
			}, 
			{
				x: 60,
				y: 30
			},
			true, 
			self.reset.bind(self)
		);
		//undo button
		this.addControl(
			'undo',
			{
				x: this.config.grid.size + this.config.grid.margin.left - 60,
				y: 100
			}, 
			{
				x: 60,
				y: 30
			},
			true, 
			self.undo.bind(self)
		);
	}

	reset()
	{
		this.history = [];

		this.score = 0;
		this.gameOver = false;

		this.grid = new Grid(this.config.size);

		fetch('./highscores.json')
		.then(response => response.json())
		.then(scores => {
			this.highscore = scores.highscore;
			this.draw();
		});
	}

	setGameOver()
	{
		this.gameOver = true;

		//save scores
		fetch('./highscores.php?score=' + this.score)
		.then(response => {
			this.draw();
		});
	}

	addControl(name, pos, size, visible, callback)
	{
		let button = {
			text: name,
			pos: pos,
			size: size,
			visible: true,
			callback: callback
		}
		this.controls[name] = button;
	}

	click(pos)
	{
		for (let name in this.controls)
		{
			let btn = this.controls[name];
			if (pos.x > btn.pos.x 
				&& pos.x < btn.pos.x + btn.size.x
				&& pos.y > btn.pos.y
				&& pos.y < btn.pos.y + btn.size.y)
			{
				btn.callback();
			}
		}
	}

	updateScore(score)
	{
		this.score += this.grid.points;
		if (this.highscore < this.score)
		{
			this.highscore = this.score;
		}
	}

	saveState(matrix)
	{
		let state = {
			matrix: matrix, 
			score: this.score, 
			highscore: this.highscore
		};

		this.history.push(state);

		if (this.history.length > this.config.maxHistory)
		{
			this.history = this.history.slice(this.history.length - this.config.maxHistory, this.config.maxHistory + 1);
		}
	}

	undo()
	{
		if (this.gameOver)
		{
			return;
		}
		let state = this.history.pop();
		if (state)
		{
			this.grid.matrix = state.matrix;
			this.score = state.score;
			this.highscore = state.highscore;
			this.draw();
		}
	}

	animate(callback)
	{
		this.animCounter++;

		//merged tiles are messed up somewhere here
		
		this.grid.dump(this.grid.matrix);

		if (this.animCounter < this.config.animFrames)
		{
			for (let i = 0; i < this.animMap.length; i++)
			{
				let anim = this.animMap[i];
				this.grid.matrix[anim.x][anim.y].x += anim.dx;
				this.grid.matrix[anim.x][anim.y].y += anim.dy;
				if (anim.merged)
				{
					this.grid.matrix[anim.x][anim.y].val = anim.merged.val;
				}
			}
			this.drawGrid();
			requestAnimationFrame(this.animate.bind(this, callback));
		} 
		else
		{
			this.grid.dump(this.grid.matrix);
			for (let i = 0; i < this.animMap.length; i++)
			{
				let anim = this.animMap[i];
				this.grid.matrix[anim.x][anim.y].x = anim.x;
				this.grid.matrix[anim.x][anim.y].y = anim.y;
				if (anim.merged)
				{
					this.grid.matrix[anim.x][anim.y].val = anim.tile.val;
				}
			}
			this.grid.dump(this.grid.matrix);
			callback();
		}
	}

	swipe(dir)
	{
		if (this.gameOver)
		{
			return;
		}
		//current game state
		let matrix = this.grid.cloneMatrix();

		if (this.grid.swipe(dir))
		{
			//push game state to state history
			this.saveState(matrix);

			this.updateScore();

			this.animCounter = 0;
			this.animMap = this.grid.getAnimMap(this.config.animFrames);

			let self = this;

			this.animate(function() {
				self.grid.updateMatrix();
				self.grid.addTile();
				if (!self.grid.checkMovesAvailable())
				{
					self.setGameOver();
				}
				self.draw();
			});
		}
	}

	drawText(text, x, y, font, color, align = "left")
	{
		this.ctx.font = font.weight + ' ' + font.size + 'px ' + font.family;
		this.ctx.fillStyle = color;
		this.ctx.textAlign = align;
		this.ctx.fillText(text,	x, y);
	}

	drawScore(title, score, pos = "center")
	{
		let size = {
			x: this.config.fonts.score.size * 6,
			y: this.config.fonts.score.size * 2.7
		}

		let y = 20;
		let x = pos == 'center' ? 
			this.config.grid.size / 2 + this.config.grid.margin.left - size.x / 2 : 
			this.config.grid.size + this.config.grid.margin.left - size.x;

		this.ctx.translate(x, y);
		this.ctx.fillStyle = this.config.colors.scoreBackground;
		this.ctx.fillRect(0, 0, size.x,	size.y);

		this.drawText(
			title,
			size.x / 2,
			size.y / 4 + this.config.fonts.score.size / 3,
			this.config.fonts.score,
			this.config.colors.lightText,
			"center"
		)

		this.drawText(
			score,
			size.x / 2,
			size.y / 4 * 3 + this.config.fonts.score.size / 3,
			this.config.fonts.score,
			this.config.colors.lightText,
			"center"
		)

		//reset grid translate
		this.ctx.setTransform(1, 0, 0, 1, 0, 0);
	}

	drawButton(button)
	{
		this.ctx.translate(button.pos.x, button.pos.y);
		this.drawText(
			button.text,
			button.size.x / 2,
			button.size.y / 2 + this.config.fonts.buttons.size / 3,
			this.config.fonts.buttons,
			this.config.colors.buttonText,
			"center"
		)
		this.ctx.setTransform(1, 0, 0, 1, 0, 0);
	}

	drawControls()
	{
		for (let button in this.controls)
		{
			this.drawButton(this.controls[button]);
		}
	}

	drawGrid()
	{
		//grid background
		this.ctx.translate(
			this.config.grid.margin.left,
			this.config.grid.margin.top
		);
		this.ctx.fillStyle = this.config.colors.gridBackground;
		this.ctx.fillRect(
			-this.config.tile.margin, 
			-this.config.tile.margin, 
			this.config.grid.size + this.config.tile.margin * 2, 
			this.config.grid.size + this.config.tile.margin * 2
		);

		for (let x = 0; x < this.config.size; x++)
		{
			for (let y = 0; y < this.config.size; y++)
			{
				this.ctx.fillStyle = this.config.colors.tiles[0];
				this.ctx.fillRect(
					x * this.config.tile.size + this.config.tile.margin, 
					y * this.config.tile.size + this.config.tile.margin, 
					this.config.tile.size - this.config.tile.margin * 2, 
					this.config.tile.size - this.config.tile.margin * 2
				);
			}
		}

		for (let x = 0; x < this.config.size; x++)
		{
			for (let y = 0; y < this.config.size; y++)
			{
				let tile = this.grid.matrix[x][y];

				//choose tile color
				if (tile.val > 0)
				{
					this.ctx.fillStyle = this.config.colors.tiles[Math.log2(tile.val)];

					//draw tile
					this.ctx.fillRect(
						tile.y * this.config.tile.size + this.config.tile.margin, 
						tile.x * this.config.tile.size + this.config.tile.margin, 
						this.config.tile.size - this.config.tile.margin * 2, 
						this.config.tile.size - this.config.tile.margin * 2
					);
				}

				//draw tile number
				if (tile.val > 0)
				{
					this.ctx.font = this.config.fonts.tiles.weight + ' ' + this.config.fonts.tiles.size + 'px ' + this.config.fonts.tiles.family;
					this.ctx.fillStyle = tile.val > 4 ? this.config.colors.lightText : this.config.colors.darkText;
					this.ctx.textAlign = "center";
					this.ctx.fillText(
						tile.val, 
						tile.y * this.config.tile.size + this.config.tile.size / 2, 
						tile.x * this.config.tile.size + this.config.tile.size / 2 + this.config.fonts.tiles.size / 3
					);
				}
			}
		}

		if (this.gameOver)
		{
			this.ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
			this.ctx.fillRect(
				-this.config.tile.margin, 
				-this.config.tile.margin, 
				this.config.grid.size + this.config.tile.margin * 2, 
				this.config.grid.size + this.config.tile.margin * 2
			);

			this.drawText(
				'Game over',
				this.config.grid.size / 2,
				this.config.grid.size / 2 - this.config.fonts.logo.size / 3,
				this.config.fonts.logo,
				this.config.colors.darkText,
				"center"
			)
		}
		//reset grid translate
		this.ctx.setTransform(1, 0, 0, 1, 0, 0);
	}

	draw()
	{

		//background
		this.ctx.fillStyle = this.config.colors.background;
		this.ctx.fillRect(
			0, 
			0, 
			this.ctx.canvas.clientWidth, 
			this.ctx.canvas.clientHeight
		);

		//logo
		this.drawText(
			'2048',
			this.config.grid.margin.left,
			this.config.fonts.logo.size + 20,
			this.config.fonts.logo,
			this.config.colors.darkText,
			"left"
		)

		//score
		this.drawScore('score',	this.score, 'center');
		//highscore
		this.drawScore('best', this.highscore, 'right');

		//controls
		this.drawControls();

		//draw grid
		this.drawGrid();
	}
}

//game configuration

document.addEventListener('DOMContentLoaded', function() {
	const canvas = document.getElementById('cnv');
	const context = canvas.getContext('2d');
	const game = new Game(context);

	//keyboard configuration
	document.onkeydown = function(event) {
		if (!event)
			event = window.event;
		var code = event.keyCode;
		if (event.charCode && code == 0)
			code = event.charCode;
		switch(code) {
			case 37:
				// Key left.
				game.swipe('left');
				break;
			case 38:
				// Key up.
				game.swipe('up');
				break;
			case 39:
				// Key right.
				game.swipe('right');
				break;
			case 40:
				// Key down.
				game.swipe('down');
				break;
			case 8:
				// Backspace
				game.undo();
				break;
			case 82:
				// R
				game.reset();
				break;
		}
		event.preventDefault();
	};

	//Binding the click event on the canvas
	canvas.addEventListener('click', function(event) {

	    let rect = canvas.getBoundingClientRect();
	    let pos = {
	        x: event.clientX - rect.left,
	        y: event.clientY - rect.top
	    };

	    game.click(pos);

	}, false);

	//binding the swipe events on the canvas
	canvas.addEventListener('touchstart', handleTouchStart, false);        
	canvas.addEventListener('touchmove', handleTouchMove, false);

	var xDown = null;                                                        
	var yDown = null;                                                        

	function handleTouchStart(evt) {                                         
	    xDown = evt.touches[0].clientX;                                      
	    yDown = evt.touches[0].clientY;                                      
	};                                                

	function handleTouchMove(evt) {
	    if ( ! xDown || ! yDown ) {
	        return;
	    }

	    var xUp = evt.touches[0].clientX;                                    
	    var yUp = evt.touches[0].clientY;

	    var xDiff = xDown - xUp;
	    var yDiff = yDown - yUp;

	    if ( Math.abs( xDiff ) > Math.abs( yDiff ) ) {/*most significant*/
	        if ( xDiff > 0 ) {
	            /* left swipe */ 
	            game.swipe('left');
	        } else {
	            /* right swipe */
	            game.swipe('right');
	        }                       
	    } else {
	        if ( yDiff > 0 ) {
	            /* up swipe */ 
	            game.swipe('up');
	        } else { 
	            /* down swipe */
	            game.swipe('down');
	        }                                                                 
	    }
	    /* reset values */
	    xDown = null;
	    yDown = null;                                             
	};
})
