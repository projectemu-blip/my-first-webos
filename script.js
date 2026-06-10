function startWebOS() {
    document.getElementById('welcomeScreen').style.display = 'none';
    document.getElementById('desktop').style.display = 'flex';
    updateTime();
    setInterval(updateTime, 1000);
} 

let windowCount = 0;
let activeWindow = null;

const snakeGames = {};
let activeSnakeGameId = null;

function openApp(appName) {
    let content = '';
    let title = '';

    switch(appName) {
        case 'notepad':
            title = 'Notepad';
            content = '<textarea style="width: 100%; height: 100%; border: none; padding: 10px; font-family: monospace;" placeholder="Type here..."></textarea>';
            break;
        case 'calculator':
            title = 'Calculator';
            content = `
                <div style="text-align: center;">
                    <input type="text" id="calcDisplay" readonly style="width: 100%; padding: 10px; margin-bottom: 10px; font-size: 18px;">
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px;">
                        <button onclick="appendCalc('7')">7</button>
                        <button onclick="appendCalc('8')">8</button>
                        <button onclick="appendCalc('9')">9</button>
                        <button onclick="appendCalc('/')">÷</button>
                        <button onclick="appendCalc('4')">4</button>
                        <button onclick="appendCalc('5')">5</button>
                        <button onclick="appendCalc('6')">6</button>
                        <button onclick="appendCalc('*')">×</button>
                        <button onclick="appendCalc('1')">1</button>
                        <button onclick="appendCalc('2')">2</button>
                        <button onclick="appendCalc('3')">3</button>
                        <button onclick="appendCalc('-')">−</button>
                        <button onclick="appendCalc('0')">0</button>
                        <button onclick="appendCalc('.')">.</button>
                        <button onclick="calculateResult()">=</button>
                        <button onclick="clearCalc()">C</button>
                    </div>
                </div>
            `;
            break;
        case 'settings':
            title = 'Settings';
            content = '<h3>WebOS Settings</h3><p>Background color: <input type="color" id="bgColor" value="#667eea"></p><button onclick="changeBackground()">Apply</button>';
            break;
        case 'snake':
            title = 'Snake';
            content = `
                <div class="snake-game">
                    <canvas id="snakeCanvas-${windowCount}" width="320" height="320"></canvas>
                    <div class="snake-controls">
                        <button onclick="startSnakeGame(${windowCount})">Start</button>
                        <button onclick="pauseSnakeGame(${windowCount})">Pause</button>
                        <button onclick="resetSnakeGame(${windowCount})">Reset</button>
                    </div>
                    <p class="snake-status" id="snakeStatus-${windowCount}">Use arrow keys to move.</p>
                </div>
            `;
            break;
        case 'drawing':
            title = 'Drawing Pad';
            content = `
                <div class="drawing-pad">
                    <div class="drawing-toolbar">
                        <label>Color
                            <input type="color" id="brushColor-${windowCount}" value="#000000"
                                onchange="changeBrushColor(${windowCount})">
                        </label>
                        <label>Size
                            <input type="range" id="brushSize-${windowCount}" min="2" max="30" value="6"
                                onchange="changeBrushSize(${windowCount})">
                        </label>
                        <button onclick="clearDrawingPad(${windowCount})">Clear</button>
                        <button onclick="saveDrawingPad(${windowCount})">Save</button>
                    </div>
                    <canvas id="drawingCanvas-${windowCount}" width="360" height="320"></canvas>
                    <p class="drawing-hint">Draw with the mouse or touch.</p>
                </div>
            `;
            break;
    }

    createWindow(title, content, appName);
}

function createWindow(title, content, appName) {
    const container = document.getElementById('windowsContainer');
    const windowDiv = document.createElement('div');
    const windowId = windowCount;
    windowDiv.className = 'window';
    windowDiv.style.left = (50 + windowCount * 30) + 'px';
    windowDiv.style.top = (50 + windowCount * 30) + 'px';
    windowDiv.style.zIndex = windowCount;

    windowDiv.innerHTML = `
        <div class="window-header">
            <span>${title}</span>
            <span class="window-close" onclick="this.parentElement.parentElement.remove()">✕</span>
        </div>
        <div class="window-content">
            ${content}
        </div>
    `;

    makeDraggable(windowDiv);
    container.appendChild(windowDiv);

    if (appName === 'snake') {
        initSnakeGame(windowId);
    }
    if (appName === 'drawing') {
        initDrawingPad(windowId);
    }

    windowCount++;
}

function initSnakeGame(id) {
    const canvas = document.getElementById(`snakeCanvas-${id}`);
    const ctx = canvas.getContext('2d');
    snakeGames[id] = {
        canvas,
        ctx,
        tileCount: 16,
        tileSize: 20,
        headX: 8,
        headY: 8,
        xVelocity: 0,
        yVelocity: 0,
        snakeParts: [],
        tailLength: 5,
        appleX: 5,
        appleY: 5,
        score: 0,
        interval: null,
        running: false
    };
    drawSnakeGame(id);
}

function startSnakeGame(id) {
    const game = snakeGames[id];
    if (!game) return;
    activeSnakeGameId = id;
    if (game.running) return;
    game.running = true;
    game.interval = setInterval(() => stepSnake(id), 100);
}

function pauseSnakeGame(id) {
    const game = snakeGames[id];
    if (!game) return;
    game.running = false;
    clearInterval(game.interval);
}

function resetSnakeGame(id) {
    const game = snakeGames[id];
    if (!game) return;
    pauseSnakeGame(id);
    initSnakeGame(id);
    updateSnakeStatus(id, 'Use arrow keys to move.');
}

function stepSnake(id) {
    const game = snakeGames[id];
    if (!game) return;

    game.headX += game.xVelocity;
    game.headY += game.yVelocity;

    if (game.headX < 0) game.headX = game.tileCount - 1;
    if (game.headX >= game.tileCount) game.headX = 0;
    if (game.headY < 0) game.headY = game.tileCount - 1;
    if (game.headY >= game.tileCount) game.headY = 0;

    for (let part of game.snakeParts) {
        if (part.x === game.headX && part.y === game.headY) {
            gameOverSnake(id);
            return;
        }
    }

    game.snakeParts.push({ x: game.headX, y: game.headY });
    while (game.snakeParts.length > game.tailLength) {
        game.snakeParts.shift();
    }

    if (game.headX === game.appleX && game.headY === game.appleY) {
        game.score += 1;
        game.tailLength += 1;
        placeSnakeApple(game);
        updateSnakeStatus(id, `Score: ${game.score}`);
    }

    drawSnakeGame(id);
}

function drawSnakeGame(id) {
    const game = snakeGames[id];
    if (!game) return;
    const { ctx, canvas, tileSize, tileCount, snakeParts, appleX, appleY } = game;

    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#222';
    for (let x = 0; x <= tileCount; x += 1) {
        ctx.fillRect(x * tileSize, 0, 1, canvas.height);
    }
    for (let y = 0; y <= tileCount; y += 1) {
        ctx.fillRect(0, y * tileSize, canvas.width, 1);
    }

    ctx.fillStyle = '#00ff55';
    for (let part of snakeParts) {
        ctx.fillRect(part.x * tileSize, part.y * tileSize, tileSize, tileSize);
    }

    ctx.fillStyle = '#ff3d3d';
    ctx.fillRect(appleX * tileSize, appleY * tileSize, tileSize, tileSize);
}

function placeSnakeApple(game) {
    let newX = Math.floor(Math.random() * game.tileCount);
    let newY = Math.floor(Math.random() * game.tileCount);

    while (game.snakeParts.some(part => part.x === newX && part.y === newY)) {
        newX = Math.floor(Math.random() * game.tileCount);
        newY = Math.floor(Math.random() * game.tileCount);
    }

    game.appleX = newX;
    game.appleY = newY;
}

function gameOverSnake(id) {
    const game = snakeGames[id];
    if (!game) return;
    pauseSnakeGame(id);
    updateSnakeStatus(id, `Game over! Score: ${game.score}`);
}

function updateSnakeStatus(id, text) {
    const status = document.getElementById(`snakeStatus-${id}`);
    if (status) status.textContent = text;
}

window.addEventListener('keydown', function (e) {
    if (activeSnakeGameId === null) return;
    const game = snakeGames[activeSnakeGameId];
    if (!game || !game.running) return;

    if (e.key === 'ArrowUp' && game.yVelocity !== 1) {
        game.xVelocity = 0;
        game.yVelocity = -1;
    }
    if (e.key === 'ArrowDown' && game.yVelocity !== -1) {
        game.xVelocity = 0;
        game.yVelocity = 1;
    }
    if (e.key === 'ArrowLeft' && game.xVelocity !== 1) {
        game.xVelocity = -1;
        game.yVelocity = 0;
    }
    if (e.key === 'ArrowRight' && game.xVelocity !== -1) {
        game.xVelocity = 1;
        game.yVelocity = 0;
    }
});

function appendCalc(value) {
    const display = document.getElementById('calcDisplay');
    if (display) display.value += value;
}

function calculateResult() {
    const display = document.getElementById('calcDisplay');
    if (!display) return;
    try {
        display.value = eval(display.value);
    } catch (e) {
        display.value = 'Error';
    }
}

function clearCalc() {
    const display = document.getElementById('calcDisplay');
    if (display) display.value = '';
}

function changeBackground() {
    const color = document.getElementById('bgColor')?.value;
    if (color) document.body.style.background = color;
}

function updateTime() {
    const now = new Date();
    const timeEl = document.getElementById('time');
    if (timeEl) {
        timeEl.textContent = now.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

function makeDraggable(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const header = element.querySelector('.window-header');
    if (!header) return;

    header.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        element.style.top = (element.offsetTop - pos2) + 'px';
        element.style.left = (element.offsetLeft - pos1) + 'px';
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

const drawingPads = {};

function initDrawingPad(id) {
    const canvas = document.getElementById(`drawingCanvas-${id}`);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const state = {
        canvas,
        ctx,
        drawing: false,
        color: '#000000',
        size: 6,
        lastX: 0,
        lastY: 0
    };

    drawingPads[id] = state;

    canvas.addEventListener('pointerdown', function(e) {
        state.drawing = true;
        const rect = canvas.getBoundingClientRect();
        state.lastX = e.clientX - rect.left;
        state.lastY = e.clientY - rect.top;
        ctx.beginPath();
        ctx.moveTo(state.lastX, state.lastY);
    });

    canvas.addEventListener('pointermove', function(e) {
        if (!state.drawing) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.strokeStyle = state.color;
        ctx.lineWidth = state.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.lineTo(x, y);
        ctx.stroke();

        state.lastX = x;
        state.lastY = y;
    });

    canvas.addEventListener('pointerup', function() {
        state.drawing = false;
    });

    canvas.addEventListener('pointerleave', function() {
        state.drawing = false;
    });
}

function changeBrushColor(id) {
    const state = drawingPads[id];
    const colorInput = document.getElementById(`brushColor-${id}`);
    if (!state || !colorInput) return;
    state.color = colorInput.value;
}

function changeBrushSize(id) {
    const state = drawingPads[id];
    const sizeInput = document.getElementById(`brushSize-${id}`);
    if (!state || !sizeInput) return;
    state.size = Number(sizeInput.value);
}

function clearDrawingPad(id) {
    const state = drawingPads[id];
    if (!state) return;
    state.ctx.fillStyle = 'white';
    state.ctx.fillRect(0, 0, state.canvas.width, state.canvas.height);
}

function saveDrawingPad(id) {
    const state = drawingPads[id];
    if (!state) return;

    const link = document.createElement('a');
    link.href = state.canvas.toDataURL('image/png');
    link.download = 'zidaan-os-drawing.png';
    link.click();
}