import {
    STATE_INTRO, STATE_MENU, STATE_HUB, STATE_PLAYING, STATE_PAUSED, STATE_GAME_OVER,
    STATE_LEVEL_COMPLETE, STATE_SEED_INPUT, CANVAS_WIDTH, CANVAS_HEIGHT,
    LEVEL_TRANSITION_TIME, INTRO_DURATION
} from '../constants.js';
import Input from './Input.js';
import EventBus from './EventBus.js';
import EntityManager from './EntityManager.js';
import Grid from '../world/Grid.js';
import DungeonGenerator from '../world/DungeonGenerator.js';
import { DUNGEON_SEED_BASE, DUNGEON_SEED_OFFSET, EXIT_COL, EXIT_ROW } from '../constants.js';
import Renderer from '../rendering/Renderer.js';
import CollisionSystem from '../systems/CollisionSystem.js';
import BombSystem from '../systems/BombSystem.js';
import AttractionSystem from '../systems/AttractionSystem.js';
import RageSystem from '../systems/RageSystem.js';
import ScoreSystem from '../systems/ScoreSystem.js';
import LevelSystem from '../systems/LevelSystem.js';
import ExperienceSystem from '../systems/ExperienceSystem.js';
import SaveSystem from '../systems/SaveSystem.js';
import SoundEngine from '../audio/SoundEngine.js';
import Player from '../entities/Player.js';
import PlayerControlBehavior from '../behaviors/PlayerControlBehavior.js';
import { gridToPixelX, gridToPixelY, pixelToGridCol, pixelToGridRow } from '../utils.js';

export default class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;
        this.ctx = canvas.getContext('2d');

        this.input = new Input();
        this.entityManager = new EntityManager();
        this.grid = new Grid();
        this.renderer = new Renderer(this.ctx, this.canvas);
        this.collisionSystem = new CollisionSystem();
        this.bombSystem = new BombSystem();
        this.attractionSystem = new AttractionSystem();
        this.rageSystem = new RageSystem();
        this.scoreSystem = new ScoreSystem();
        this.levelSystem = new LevelSystem();
        this.experienceSystem = new ExperienceSystem();
        this.saveSystem = new SaveSystem();
        this.soundEngine = new SoundEngine();

        this.state = STATE_INTRO;
        this.introTimer = INTRO_DURATION;
        this.level = 1; // Agora representa "dungeons completadas"
        this.player = null;
        this.levelTime = 0;
        this.transitionTimer = 0;
        this.menuSelection = 0;
        this.hubSelection = 0; // Seleção no HUB
        this.lastTime = 0;
        this.hasSaveGame = this.saveSystem.hasSave();
        this.currentLevelSeed = null;
        this.currentLevelSeedString = null;
        this.pendingSaveData = null;
        this.customSeed = null; // Seed customizada definida pelo usuário
        this.seedInput = ''; // Texto digitado para seed
        this.dungeonsCompleted = 0; // Contador de dungeons completadas
        this.survivalTime = 0; // Tempo total de sobrevivência
        this.dungeonStartTime = 0; // Tempo de início da dungeon atual
        this.currentDungeonDifficulty = 1; // Dificuldade da dungeon atual

        this._setupEvents();
    }

    _setupEvents() {
        EventBus.on('player:died', () => this._onPlayerDied());
        EventBus.on('level:complete', () => this._onLevelComplete());
        EventBus.on('brick:destroyed', () => {
            const theme = this.currentDungeonTheme || 'ruins';
            const seed = this.currentLevelSeed || Date.now();
            this.renderer.backgroundLayer.rebuild(this.grid, theme, seed);
            this.soundEngine.play('brickBreak');
        });
        EventBus.on('powerup:collected', () => {
            this.soundEngine.play('powerup');
        });
        EventBus.on('player:hit', ({ damage }) => {
            // Feedback visual for taking damage
            this.renderer.particleSystem.emitDamage(this.player.x, this.player.y, damage);
            // Save automático ao tomar dano
            if (this.player && this.state === STATE_PLAYING) {
                this.saveSystem.save({
                    player: this.player,
                    level: this.level,
                    score: this.scoreSystem.score,
                    levelSeed: this.currentLevelSeed,
                    dungeonsCompleted: this.dungeonsCompleted,
                    survivalTime: this.survivalTime,
                });
            }
        });
        EventBus.on('player:levelup', ({ player, level }) => {
            this.soundEngine.play('levelUp');
            this.renderer.particleSystem.emitLevelUp(player.x, player.y);
        });
        EventBus.on('xp:gained', ({ amount }) => {
            this.renderer.particleSystem.emitXPGain(this.player.x, this.player.y - 20, amount);
        });
        EventBus.on('player:physicalAttack', ({ x, y, direction, hit }) => {
            this.renderer.particleSystem.emitPhysicalAttack(x, y, direction, hit);
        });
        
        // Rage System events
        EventBus.on('rage:triggered', ({ explosionCol, explosionRow, cells }) => {
            this._handleRageTriggered(explosionCol, explosionRow, cells);
        });
        
        EventBus.on('zombie:rage_start', ({ zombie }) => {
            // Optional: play sound effect
            // this.soundEngine.play('zombieRage');
        });
        
        EventBus.on('zombie:rage_arrived', ({ zombie }) => {
            // Optional: play sound effect
            // this.soundEngine.play('zombieRageArrival');
        });
    }

    start() {
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this._loop(t));
    }

    _loop(timestamp) {
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05); // cap at 50ms
        this.lastTime = timestamp;

        this._update(dt);
        this._render();

        this.input.endFrame();
        requestAnimationFrame((t) => this._loop(t));
    }

    _update(dt) {
        switch (this.state) {
            case STATE_INTRO:
                this._updateIntro(dt);
                break;
            case STATE_MENU:
                this._updateMenu(dt);
                break;
            case STATE_HUB:
                this._updateHub(dt);
                break;
            case STATE_PLAYING:
                this._updatePlaying(dt);
                break;
            case STATE_PAUSED:
                this._updatePaused(dt);
                break;
            case STATE_GAME_OVER:
                this._updateEndScreen(dt);
                break;
            case STATE_LEVEL_COMPLETE:
                this._updateLevelComplete(dt);
                break;
            case STATE_SEED_INPUT:
                this._updateSeedInput(dt);
                break;
        }
    }

    _updateIntro(dt) {
        this.introTimer -= dt;

        // Auto-transition após 3 segundos OU skip com Enter/Space
        if (this.introTimer <= 0 ||
            this.input.wasPressed('Enter') ||
            this.input.wasPressed('Space')) {
            this.state = STATE_MENU;
            this.menuSelection = 0;
        }
    }

    _updateMenu(dt) {
        const maxMenuItems = this.hasSaveGame ? 3 : 2; // New Game, Continue (se houver), High Scores
        
        if (this.input.wasPressed('ArrowUp') || this.input.wasPressed('KeyW')) {
            this.menuSelection = (this.menuSelection + maxMenuItems - 1) % maxMenuItems;
            this.soundEngine.play('menuSelect');
        }
        if (this.input.wasPressed('ArrowDown') || this.input.wasPressed('KeyS')) {
            this.menuSelection = (this.menuSelection + 1) % maxMenuItems;
            this.soundEngine.play('menuSelect');
        }
        if (this.input.wasPressed('Enter') || this.input.wasPressed('Space')) {
            if (this.hasSaveGame && this.menuSelection === 0) {
                this._continueGame();
            } else if ((this.hasSaveGame && this.menuSelection === 1) || (!this.hasSaveGame && this.menuSelection === 0)) {
                this._startGame();
            }
            // High scores é apenas visualização
        }
    }

    _updateHub(dt) {
        const maxHubItems = 2; // Enter Dungeon, High Scores
        
        if (this.input.wasPressed('ArrowUp') || this.input.wasPressed('KeyW')) {
            this.hubSelection = (this.hubSelection + maxHubItems - 1) % maxHubItems;
            this.soundEngine.play('menuSelect');
        }
        if (this.input.wasPressed('ArrowDown') || this.input.wasPressed('KeyS')) {
            this.hubSelection = (this.hubSelection + 1) % maxHubItems;
            this.soundEngine.play('menuSelect');
        }
        if (this.input.wasPressed('Enter') || this.input.wasPressed('Space')) {
            if (this.hubSelection === 0) {
                // Enter Dungeon
                this._enterDungeon();
            }
            // High scores é apenas visualização
        }
    }

    _updateSeedInput(dt) {
        // Capturar caracteres digitados usando wasPressed para teclas especiais
        if (this.input.wasPressed('Backspace')) {
            this.seedInput = this.seedInput.slice(0, -1);
        } else if (this.input.wasPressed('Enter')) {
            // Confirmar seed
            this.customSeed = this.seedInput.trim() || null;
            this.seedInput = '';
            this.state = STATE_MENU;
            this.soundEngine.play('menuSelect');
        } else if (this.input.wasPressed('Escape')) {
            // Cancelar
            this.seedInput = '';
            this.state = STATE_MENU;
            this.soundEngine.play('menuSelect');
        } else {
            // Capturar caracteres alfanuméricos
            const key = this.input._getLastKey();
            if (key && key.length === 1 && /[a-zA-Z0-9]/.test(key)) {
                // Apenas letras e números, máximo 20 caracteres
                if (this.seedInput.length < 20) {
                    this.seedInput += key;
                    // Resetar lastKey após usar para evitar repetição
                    this.input.lastKey = null;
                }
            }
        }
    }

    _updatePlaying(dt) {
        if (this.input.pause) {
            this.state = STATE_PAUSED;
            this.soundEngine.play('menuSelect');
            return;
        }

        this.levelTime += dt;
        this.survivalTime += dt;

        // Verificar escape (tecla E quando na entrada)
        if (this.player && this._isPlayerAtEntrance()) {
            if (this.input.escape || (this.input.wasPressed('Escape') && this._isPlayerAtEntrance())) {
                this._escapeDungeon();
                return;
            }
        }

        const context = {
            grid: this.grid,
            input: this.input,
            entityManager: this.entityManager,
            player: this.player,
            bombSystem: this.bombSystem,
            soundEngine: this.soundEngine,
            attractionSystem: this.attractionSystem,
            rageSystem: this.rageSystem,
            level: this.level,
        };

        this.entityManager.update(dt, context);
        this.bombSystem.update(dt, context);
        this.attractionSystem.update(dt);
        this.rageSystem.update(dt);
        this.collisionSystem.update(context);
        this.levelSystem.update(context);
        this.experienceSystem.update(context);
        this.renderer.particleSystem.update(dt);
    }

    _isPlayerAtEntrance() {
        if (!this.player) return false;
        const playerCol = pixelToGridCol(this.player.x);
        const playerRow = pixelToGridRow(this.player.y);
        return playerCol === EXIT_COL && playerRow === EXIT_ROW;
    }

    _updatePaused(dt) {
        if (this.input.pause) {
            this.state = STATE_PLAYING;
            this.soundEngine.play('menuSelect');
        }
    }

    _updateEndScreen(dt) {
        if (this.input.wasPressed('Enter') || this.input.wasPressed('Space')) {
            this.state = STATE_MENU;
            this.menuSelection = 0;
            // Atualizar hasSaveGame ao voltar ao menu
            this.hasSaveGame = this.saveSystem.hasSave();
        }
    }

    _updateLevelComplete(dt) {
        this.transitionTimer -= dt;
        if (this.transitionTimer <= 0) {
            // Completou dungeon - voltar ao HUB
            this.dungeonsCompleted++;
            this._enterHub();
        }
    }

    _startGame() {
        this.level = 1;
        this.dungeonsCompleted = 0;
        this.survivalTime = 0;
        this.scoreSystem.reset();
        this.saveSystem.deleteSave(); // Deletar save ao começar novo jogo
        this.hasSaveGame = false;
        this.soundEngine.play('menuSelect');
        
        // Criar player inicial
        this.player = new Player(
            gridToPixelX(1),
            gridToPixelY(1),
            new PlayerControlBehavior()
        );
        
        this._enterHub();
    }

    _continueGame() {
        const saveData = this.saveSystem.load();
        if (!saveData) {
            this.hasSaveGame = false;
            this._startGame();
            return;
        }

        // Restaurar estado do jogo
        this.level = saveData.game.dungeonLevel || 1;
        this.dungeonsCompleted = saveData.run?.dungeonsCompleted || 0;
        this.survivalTime = saveData.run?.survivalTime || 0;
        this.scoreSystem.score = saveData.game.score || 0;
        
        this.soundEngine.play('menuSelect');
        
        // Criar player com stats salvos
        this.player = new Player(
            gridToPixelX(1),
            gridToPixelY(1),
            new PlayerControlBehavior()
        );
        this.saveSystem.applyToPlayer(this.player, saveData);
        
        this._enterHub();
    }

    _enterHub() {
        this.state = STATE_HUB;
        this.hubSelection = 0;
        
        // Save automático ao entrar no HUB (estado seguro)
        if (this.player) {
            this.saveSystem.save({
                player: this.player,
                level: this.level,
                score: this.scoreSystem.score,
                levelSeed: this.currentLevelSeed,
                dungeonsCompleted: this.dungeonsCompleted,
                survivalTime: this.survivalTime,
            });
            this.hasSaveGame = true;
        }
    }

    _enterDungeon() {
        // Usar level atual como dificuldade da dungeon (será expandido na Fase 14)
        const dungeonDifficulty = Math.min(this.level, 10); // Cap em 10 por enquanto
        this.currentDungeonDifficulty = dungeonDifficulty;
        
        this.dungeonStartTime = this.survivalTime;
        this.levelTime = 0;
        this._loadLevel(dungeonDifficulty);
    }

    _escapeDungeon() {
        // Escape da dungeon - voltar ao HUB mantendo loot
        this.soundEngine.play('menuSelect');
        this._enterHub();
    }

    _loadLevel(dungeonDifficulty = null) {
        this.entityManager.clear();
        this.grid.clear();
        this.renderer.particleSystem.clear();

        // Usar dificuldade fornecida ou level atual
        const difficulty = dungeonDifficulty || this.level;
        
        // Gerar ou usar seed existente
        const seed = this._getLevelSeed(difficulty);
        const genResult = DungeonGenerator.generate(this.grid, difficulty, seed);
        
        // Armazenar seed e tema para referência
        this.currentLevelSeed = genResult.seed;
        this.currentLevelSeedString = genResult.seedString;
        this.currentDungeonTheme = genResult.theme || 'ruins';

        this.renderer.backgroundLayer.rebuild(this.grid, this.currentDungeonTheme, this.currentLevelSeed);

        // Spawn player at top-left safe zone (entrada da dungeon)
        if (!this.player) {
            this.player = new Player(
                gridToPixelX(1),
                gridToPixelY(1),
                new PlayerControlBehavior()
            );
        } else {
            // Resetar posição para entrada
            this.player.x = gridToPixelX(1);
            this.player.y = gridToPixelY(1);
        }

        this.entityManager.add(this.player, 'player');

        // Spawn enemies com mesma seed
        this.levelSystem.spawnEnemies(difficulty, this.grid, this.entityManager, seed);

        this.levelTime = 0;
        this.state = STATE_PLAYING;

        EventBus.emit('level:started', { level: difficulty });
    }

    _getLevelSeed(level) {
        // Se houver seed customizada, usar
        if (this.customSeed !== null) {
            return this.customSeed;
        }
        // Se houver seed salva, usar; senão gerar nova
        if (this.pendingSaveData?.game?.levelSeed) {
            return this.pendingSaveData.game.levelSeed;
        }
        // Gerar seed determinística baseada no nível
        return level * DUNGEON_SEED_BASE + DUNGEON_SEED_OFFSET;
    }

    _onPlayerDied() {
        this.soundEngine.play('death');
        this.renderer.particleSystem.emitDeath(this.player.x, this.player.y);

        // Permadeath - deletar save permanentemente
        this.saveSystem.deleteSave();
        this.hasSaveGame = false;

        // Salvar high score com métricas da run
        this.scoreSystem.saveHighScore();
        this.state = STATE_GAME_OVER;
    }

    _onLevelComplete() {
        const timeBonus = Math.max(0, 3000 - Math.floor(this.levelTime)) * this.level;
        const levelBonus = 1000 * this.level;
        this.scoreSystem.addScore(timeBonus + levelBonus);
        this.soundEngine.play('levelComplete');

        // Incrementar level (dungeons completadas)
        this.level++;

            // Salvar progresso ao completar dungeon
        this.saveSystem.save({
            player: this.player,
            level: this.level,
            score: this.scoreSystem.score,
            levelSeed: this.currentLevelSeed,
            dungeonsCompleted: this.dungeonsCompleted,
            survivalTime: this.survivalTime,
        });
        this.hasSaveGame = true;

        this.transitionTimer = LEVEL_TRANSITION_TIME;
        this.state = STATE_LEVEL_COMPLETE;
    }

    /**
     * Handle rage triggered event - start rage for all enemies
     * @param {number} explosionCol - Explosion grid column
     * @param {number} explosionRow - Explosion grid row
     * @param {Array} cells - Array of cells affected by explosion
     */
    _handleRageTriggered(explosionCol, explosionRow, cells) {
        const enemies = this.entityManager.getLayer('enemies');
        
        for (const enemy of enemies) {
            if (!enemy.alive) continue;
            
            const zombieCol = pixelToGridCol(enemy.x);
            const zombieRow = pixelToGridRow(enemy.y);
            
            // Calculate dynamic duration
            const duration = this.rageSystem.calculateRageDuration(
                zombieCol,
                zombieRow,
                explosionCol,
                explosionRow,
                enemy.enemyType
            );
            
            // Start rage
            enemy.startRage(
                { col: explosionCol, row: explosionRow, cells },
                duration,
                this.rageSystem
            );
        }
    }

    _render() {
        const renderContext = {
            state: this.state,
            grid: this.grid,
            entityManager: this.entityManager,
            player: this.player,
            level: this.state === STATE_PLAYING ? this.currentDungeonDifficulty : this.level, // Dificuldade durante jogo, dungeons completadas no HUB
            score: this.scoreSystem.score,
            highScores: this.scoreSystem.getHighScores(),
            levelTime: this.levelTime,
            menuSelection: this.menuSelection,
            hubSelection: this.hubSelection,
            dungeonsCompleted: this.dungeonsCompleted,
            survivalTime: this.survivalTime,
            transitionTimer: this.transitionTimer,
            hasSaveGame: this.hasSaveGame,
            seedString: this.currentLevelSeedString,
            seedInput: this.seedInput,
            customSeed: this.customSeed,
            canEscape: this.state === STATE_PLAYING && this._isPlayerAtEntrance(),
            introTimer: this.introTimer,
        };
        this.renderer.render(renderContext);
    }
}
