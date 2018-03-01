class Grid
{
	constructor(ctx, config)
	{
		this.config = config;

		this.ctx = ctx;

		this.setupSize();

		this.setupControls();

		this.reset();
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

		this.setMatrix();

		for (let i = 0; i < 2; i++)
		{
			this.insertCell();
		}
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

	checkMovesAvailable()
	{
		for (let y = 0; y < this.config.size; y++)
		{
			for (let x = 0; x < this.config.size; x++)
			{
				if (this.matrix[y][x].val == 0 ||
					(y + 1 < this.config.size && this.matrix[y][x].val == this.matrix[y + 1][x].val) ||
					(x + 1 < this.config.size && this.matrix[y][x].val == this.matrix[y][x + 1].val))
				{
					return true;
				}
			}
		}
		return false;
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

	setMatrix()
	{
		this.matrix = new Array(this.config.size);
		for (let i = 0; i < this.config.size; i++)
		{
			this.matrix[i] = new Array(this.config.size);
		}
		for (let y = 0; y < this.config.size; y++)
		{
			for (let x = 0; x < this.config.size; x++)
			{
				this.matrix[y][x] = {
					val: 0,
					x: x,
					y: y
				}
			}
		}
	}

	insertCell()
	{
		let emptyTiles = new Array();
		for (let y = 0; y < this.config.size; y++)
		{
			for (let x = 0; x < this.config.size; x++)
			{
				if (this.matrix[y][x].val === 0)
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
		let val = Math.random() > 0.5 ? 2 : 4;
		this.matrix[cell.y][cell.x].val = val;
		return true;
	}

	updateScore(score)
	{
		this.score += score;
		if (this.highscore < this.score)
		{
			this.highscore = this.score;
		}
	}

	getState()
	{
		let state = {
			matrix: this.clone(this.matrix), 
			score: this.score, 
			highscore: this.highscore
		};
		return state;
	}

	saveState(state)
	{
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
			this.matrix = this.clone(state.matrix);
			this.score = state.score;
			this.highscore = state.highscore;
			this.draw();
		}
	}

	clone(matrix)
	{
		// return matrix.map(arr => arr.slice(0));
		return JSON.parse(JSON.stringify(matrix));
	}

	transpose(matrix)
	{
		return matrix[0].map((col, i) => matrix.map(row => row[i]));
	}

	rotate(matrix, times = 1)
	{
		for (let i = 0; i < times; i++)
		{
			matrix = this.transpose(matrix.reverse());
		}
		return matrix;
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
					line[i].val *= 2;
					line[j].val = 0;
					this.updateScore(line[i].val);
				}
				break;
			}
		}
		return line;
	}

	move(line)
	{
		line = line.filter(x => x.val);

		let add = this.config.size - line.length;

		for (let i = 0; i < add; i++)
		{
			line.push({val: 0});
		}

		return line;
	}

	changed(arr1, arr2)
	{
		for (let y = 0; y < arr1.length; y++)
		{
			for (let x = 0; x < arr1[y].length; x++)
			{
				if (arr1[y][x].val !== arr2[y][x].val)
				{
					return true;
				}
			}
		}
		return false;
	}

	updateMatrix(matrix)
	{
		this.animMap = [];
		for (let y = 0; y < this.config.size; y++)
		{
			for (let x = 0; x < this.config.size; x++)
			{
				if ((matrix[y][x].x && matrix[y][x].x != x) ||
					(matrix[y][x].y && matrix[y][x].y != y))
				{
					this.animMap.push({
						x: x,
						y: y,
						x0: matrix[y][x].x,
						y0: matrix[y][x].y,
						dx: (x - matrix[y][x].x) / 10,
						dy: (y - matrix[y][x].y) / 10,
						tile: matrix[y][x]
					});
				}
				matrix[y][x].x = x;
				matrix[y][x].y = y;
			}
		}

		return matrix;
	}

	animate(callback)
	{
		this.animCounter++;
		for (let i = 0; i < this.animMap.length; i++)
		{
			let anim = this.animMap[i];
			this.matrix[anim.y0][anim.x0].x += anim.dx;
			this.matrix[anim.y0][anim.x0].y += anim.dy;
		}

		if (this.animCounter < 10)
		{
			this.draw();
			requestAnimationFrame(this.animate.bind(this, callback));
		} 
		else
		{
			callback();
		}
	}

	swipe(dir)
	{
		if (this.gameOver)
		{
			return;
		}
		let angles = {
			'up': 0,
			'right': 1,
			'down': 2,
			'left': 3
		}
		let angle = angles[dir];

		//current game state
		let state = this.getState();

		let matrix = this.clone(this.matrix);
		matrix = this.rotate(matrix, angle);

		for (let i = 0; i < matrix.length; i++)
		{
			matrix[i] = this.concat(matrix[i]);
			matrix[i] = this.move(matrix[i]);
		}

		matrix = this.rotate(matrix, 4 - angle);

		if (this.changed(this.matrix, matrix))
		{
			//push game state to state history
			this.saveState(state);

			matrix = this.updateMatrix(matrix);

			this.animCounter = 0;
			let self = this;
			this.animate(function() {
				self.matrix = matrix;
				self.insertCell();
				if (!self.checkMovesAvailable())
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

		for (let y = 0; y < this.config.size; y++)
		{
			for (let x = 0; x < this.config.size; x++)
			{
				let cellValue = this.matrix[y][x].val;

				//choose tile color
				if (cellValue > 0)
				{
					this.ctx.fillStyle = this.config.colors.tiles[Math.log2(cellValue)];
				}
				else 
				{
					this.ctx.fillStyle = this.config.colors.tiles[0];
				}
				//draw tile
				this.ctx.fillRect(
					this.matrix[y][x].y * this.config.tile.size + this.config.tile.margin, 
					this.matrix[y][x].x * this.config.tile.size + this.config.tile.margin, 
					this.config.tile.size - this.config.tile.margin * 2, 
					this.config.tile.size - this.config.tile.margin * 2
				);

				//draw tile number
				if (cellValue > 0)
				{
					this.ctx.font = this.config.fonts.tiles.weight + ' ' + this.config.fonts.tiles.size + 'px ' + this.config.fonts.tiles.family;
					this.ctx.fillStyle = cellValue > 4 ? this.config.colors.lightText : this.config.colors.darkText;
					this.ctx.textAlign = "center";
					this.ctx.fillText(
						cellValue, 
						this.matrix[y][x].y * this.config.tile.size + this.config.tile.size / 2, 
						this.matrix[y][x].x * this.config.tile.size + this.config.tile.size / 2 + this.config.fonts.tiles.size / 3
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
}

//game configuration
const config = {
	'size': 4,
	'maxHistory': 1,
	'colors': {
		'tiles': [
			'#ffffff', //0
			'#eee4da', //2
			'#ece0cb', //4
			'#f2b179', //8
			'#ec8d53', //16
			'#f57b5f', //32
			'#e95839', //64
			'#f4d86d', //128
			'#f2d04a', //256
			'#e9c64c', //512
			'#eac33f', //1024
			'#eac33f', //2048
			'#ed6569', //4096
			'#eb4b55', //8192
			'#f13f3d', //16384
			'#6eb3d4', //32768
			'#599edd', //65536
			'#1782ca' //131072
		],
		'background': '#fbf8f2',
		'scoreBackground': '#bcaea0',
		'gridBackground': '#bcaea0',
		'buttonText': '#ea8211',
		'darkText': '#776d66',
		'lightText': '#eeeeee'
	},
	'fonts': {
		'tiles': {
			'size': 40,
			'family': 'Arial',
			'weight': 'bold'
		},
		'logo': {
			'size': 50,
			'family': 'Arial',
			'weight': 'bold'
		},
		'buttons': {
			'size': 26,
			'family': 'Arial',
			'weight': 'bold'
		},
		'score': {
			'size': 23,
			'family': 'Arial',
			'weight': 'bold'
		}
	}
}

document.addEventListener('DOMContentLoaded', function() {
	const canvas = document.getElementById('cnv');
	const context = canvas.getContext('2d');
	const grid = new Grid(context, config);

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
				grid.swipe('left');
				break;
			case 38:
				// Key up.
				grid.swipe('up');
				break;
			case 39:
				// Key right.
				grid.swipe('right');
				break;
			case 40:
				// Key down.
				grid.swipe('down');
				break;
			case 8:
				// Backspace
				grid.undo();
				break;
			case 82:
				// R
				grid.reset();
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

	    grid.click(pos);

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
	            grid.swipe('left');
	        } else {
	            /* right swipe */
	            grid.swipe('right');
	        }                       
	    } else {
	        if ( yDiff > 0 ) {
	            /* up swipe */ 
	            grid.swipe('up');
	        } else { 
	            /* down swipe */
	            grid.swipe('down');
	        }                                                                 
	    }
	    /* reset values */
	    xDown = null;
	    yDown = null;                                             
	};
})
