// Constante para Sukamon (último Digimon en la lista)
const SUKAMON = digimonList[digimonList.length - 1];

class DigimonGame {
    /**
     * Constructor de la clase DigimonGame
     * Inicializa el juego, configura el tablero, los eventos, sonidos y el modal
     */
    constructor() {
        // Inicialización de variables del juego
        this.board = Array(16).fill(null);      // Tablero 4x4 vacío
        this.playerScore = 0;                   // Puntuación del jugador
        this.cpuScore = 0;                      // Puntuación de la CPU
        this.isPlayerTurn = true;               // Control de turnos
        this.moves = 0;                         // Contador de movimientos
        this.gameOver = false;                  // Estado del juego
        this.mustRollDice = false;              // Control del dado

        // Inicialización de componentes del juego
        this.initializeBoard();
        this.setupEventListeners();
        this.updateDisplay();

        // Configuración de audio
        this.backgroundMusic = document.getElementById('background-music');
        this.successSound = document.getElementById('success-sound');
        this.failSound = document.getElementById('fail-sound');
        
        // Iniciar música de fondo con volumen más bajo
        this.backgroundMusic.volume = 0.1; // Volumen al 10%
        this.successSound.volume = 0.2;    // Volumen al 20%
        this.failSound.volume = 0.2;       // Volumen al 20%
        
        // Intentar reproducir la música
        this.backgroundMusic.play().catch(error => {
            console.log("Reproducción automática bloqueada por el navegador");
            // Podríamos añadir un botón para iniciar la música manualmente si es necesario
        });

        // Configuración del modal
        this.setupModal();

        // Mostrar instrucciones al inicio
        this.showInstructions();
    }

    /**
     * Inicializa el tablero de juego
     * Coloca 5 Digimon aleatoriamente y crea la estructura visual
     */
    initializeBoard() {
        // Colocar 5 Digimon aleatoriamente
        const positions = Array(16).fill(false);
        let digimonPlaced = 0;
        
        while (digimonPlaced < 5) {
            const pos = Math.floor(Math.random() * 16);
            if (!positions[pos]) {
                positions[pos] = true;
                this.board[pos] = digimonList[digimonPlaced];
                digimonPlaced++;
            }
        }

        // Crear el tablero visual
        const gameBoard = document.querySelector('.game-board');
        gameBoard.innerHTML = '';
        
        for (let i = 0; i < 16; i++) {
            const cell = document.createElement('button');
            cell.className = 'cell';
            cell.dataset.index = i;
            gameBoard.appendChild(cell);
        }
    }

    /**
     * Configura los event listeners para los elementos interactivos del juego
     * Maneja los clicks en el tablero y botones
     */
    setupEventListeners() {
        document.querySelector('.game-board').addEventListener('click', (e) => {
            if (e.target.classList.contains('cell') && !this.gameOver && this.isPlayerTurn) {
                this.handleCellClick(e.target);
            }
        });

        document.getElementById('extra-turn-btn').addEventListener('click', () => {
            this.tryExtraTurn();
        });

        document.getElementById('reset-btn').addEventListener('click', () => {
            this.resetGame();
        });
    }

    /**
     * Maneja el clic en una celda del tablero
     * Controla la lógica de encontrar Digimon y turnos
     * @param {HTMLElement} cell - Celda clickeada
     */
    handleCellClick(cell) {
        // Verificaciones previas
        if (this.mustRollDice) return;
        if (cell.classList.contains('revealed')) return;

        const index = cell.dataset.index;
        this.moves++;
        
        if (this.board[index]) {
            // Caso: Encontró un Digimon
            const img = document.createElement('img');
            img.src = this.board[index].image;
            img.alt = this.board[index].name;
            cell.innerHTML = '';
            cell.appendChild(img);
            cell.classList.add('revealed', 'player-hit');
            this.playerScore++;
            // Siempre habilitamos el botón cuando encuentra un Digimon
            document.getElementById('extra-turn-btn').disabled = false;
            this.successSound.volume = 0.2;
            this.successSound.play();
            
            this.mustRollDice = true;
            
            this.checkWinner();
        } else {
            // Caso: No encontró nada - Mostrar Sukamon
            const img = document.createElement('img');
            img.src = SUKAMON.image;
            img.alt = SUKAMON.name;
            cell.innerHTML = '';
            cell.appendChild(img);
            cell.classList.add('revealed', 'fail');
            this.failSound.volume = 0.2;
            this.failSound.play();
            this.isPlayerTurn = false;
            setTimeout(() => this.cpuTurn(), 1000);
        }
        
        this.updateDisplay();
    }

    /**
     * Maneja la lógica del turno extra con el dado
     * Muestra animación y determina si el jugador obtiene otro turno
     */
    async tryExtraTurn() {
        const diceContainer = document.getElementById('dice-animation');
        const diceResult = document.getElementById('dice-result');
        const roll = Math.floor(Math.random() * 6) + 1;
        
        // Secuencia de animación del dado
        diceContainer.classList.remove('hidden');
        diceResult.style.display = 'none';
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        diceResult.textContent = roll;
        diceResult.style.display = 'block';
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (roll === 6) {
            await this.showModal('¡Turno Extra!', '¡Has sacado un 6! Tienes otro turno.');
            this.mustRollDice = false;
        } else {
            // Ya no mostramos modal, simplemente pasamos el turno
            this.isPlayerTurn = false;
            this.mustRollDice = false;
            document.getElementById('extra-turn-btn').disabled = true;
            setTimeout(() => this.cpuTurn(), 1000);
        }
        
        setTimeout(() => {
            diceContainer.classList.add('hidden');
        }, 2000);
    }

    /**
     * Ejecuta el turno de la CPU
     * Selecciona una celda aleatoria y procesa el resultado
     */
    cpuTurn() {
        let availableCells = Array.from(document.querySelectorAll('.cell:not(.revealed)'));
        if (availableCells.length === 0) return;

        // Selección aleatoria de celda
        const randomCell = availableCells[Math.floor(Math.random() * availableCells.length)];
        const index = randomCell.dataset.index;

        // Procesar resultado
        if (this.board[index]) {
            const img = document.createElement('img');
            img.src = this.board[index].image;
            img.alt = this.board[index].name;
            randomCell.innerHTML = '';
            randomCell.appendChild(img);
            randomCell.classList.add('revealed', 'cpu-hit');
            this.cpuScore++;
        } else {
            // Mostrar Sukamon para la CPU también
            const img = document.createElement('img');
            img.src = SUKAMON.image;
            img.alt = SUKAMON.name;
            randomCell.innerHTML = '';
            randomCell.appendChild(img);
            randomCell.classList.add('revealed', 'fail');
        }

        randomCell.classList.add('revealed');
        this.isPlayerTurn = true;
        this.updateDisplay();
        this.checkWinner();
        
        if (!this.gameOver) {
            this.disableCells(false);
        }
    }

    /**
     * Verifica si hay un ganador
     * Muestra el modal correspondiente y actualiza el histórico
     */
    async checkWinner() {
        if (this.playerScore >= 3) {
            this.gameOver = true;
            const playerName = await this.showModal('¡Felicidades!', '¡Has ganado el juego!', true);
            if (playerName) {
                this.addToHistory(playerName, this.moves);
            }
        } else if (this.cpuScore >= 3) {
            this.gameOver = true;
            await this.showModal('Fin del Juego', 'La CPU ha ganado.');
            this.addToHistory('CPU', this.moves);
        }
    }

    /**
     * Reinicia el juego a su estado inicial
     * Resetea puntuaciones, tablero y música
     */
    resetGame() {
        // Resetear variables del juego
        this.board = Array(16).fill(null);
        this.playerScore = 0;
        this.cpuScore = 0;
        this.isPlayerTurn = true;
        this.moves = 0;
        this.gameOver = false;
        this.mustRollDice = false;

        // Resetear elementos visuales
        document.getElementById('extra-turn-btn').disabled = true;
        this.initializeBoard();
        this.updateDisplay();

        // Reiniciar música manteniendo el volumen bajo
        this.backgroundMusic.currentTime = 0;
        this.backgroundMusic.volume = 0.1;
        this.backgroundMusic.play().catch(error => {
            console.log("Reproducción bloqueada al reiniciar");
        });

        // Habilitar interacción
        this.disableCells(false);
    }

    /**
     * Habilita o deshabilita la interacción con las celdas no reveladas
     * @param {boolean} disabled - True para deshabilitar, false para habilitar
     */
    disableCells(disabled) {
        const cells = document.querySelectorAll('.cell:not(.revealed)');
        cells.forEach(cell => {
            cell.style.pointerEvents = disabled ? 'none' : 'auto';
        });
    }

    /**
     * Configura el modal y sus eventos
     * Inicializa los elementos del modal y configura el botón de cierre
     */
    setupModal() {
        this.modal = document.getElementById('modal');
        this.modalTitle = document.getElementById('modal-title');
        this.modalMessage = document.getElementById('modal-message');
        this.modalInputContainer = document.getElementById('modal-input-container');
        this.playerNameInput = document.getElementById('player-name-input');
        
        document.getElementById('modal-close').addEventListener('click', () => {
            const playerName = this.playerNameInput.value;
            if (this.modalInputContainer.classList.contains('hidden') || playerName.trim()) {
                this.modal.classList.add('hidden');
                if (this.onModalClose) {
                    this.onModalClose(playerName);
                }
            }
        });
    }

    /**
     * Muestra el modal con el contenido especificado
     * @param {string} title - Título del modal
     * @param {string} message - Mensaje a mostrar
     * @param {boolean} showInput - Indica si se debe mostrar el campo de entrada
     * @returns {Promise} Promesa que se resuelve con el valor del input (si existe)
     */
    showModal(title, message, showInput = false) {
        this.modalTitle.textContent = title;
        this.modalMessage.textContent = message;
        this.modalInputContainer.classList.toggle('hidden', !showInput);
        this.playerNameInput.value = '';
        this.modal.classList.remove('hidden');
        
        return new Promise(resolve => {
            this.onModalClose = resolve;
        });
    }

    /**
     * Añade una entrada al histórico de jugadores
     * @param {string} name - Nombre del jugador
     * @param {number} moves - Número de movimientos realizados
     */
    addToHistory(name, moves) {
        const history = document.getElementById('game-history');
        const entry = document.createElement('div');
        entry.textContent = `${name} → ${moves} tiradas`;
        history.appendChild(entry);
    }

    /**
     * Actualiza la información mostrada en pantalla
     * Actualiza puntuaciones y el indicador de turno
     */
    updateDisplay() {
        document.getElementById('player-score').textContent = this.playerScore;
        document.getElementById('cpu-score').textContent = this.cpuScore;
        document.getElementById('turn-indicator').textContent = 
            `Turno: ${this.isPlayerTurn ? 'Jugador' : 'CPU'}`;
    }

    async showInstructions() {
        const instructionsModal = document.getElementById('instructions-modal');
        instructionsModal.classList.remove('hidden');

        return new Promise(resolve => {
            document.getElementById('start-game').addEventListener('click', () => {
                instructionsModal.classList.add('hidden');
                resolve();
            });
        });
    }
}

// Iniciar el juego cuando se carga la página
window.addEventListener('load', () => {
    new DigimonGame();
}); 