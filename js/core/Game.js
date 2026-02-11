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
import HubLevelGenerator from '../world/HubLevelGenerator.js';
import {
    DUNGEON_SEED_BASE, DUNGEON_SEED_OFFSET, EXIT_COL, EXIT_ROW,
    HUB_SPAWN_COL, HUB_SPAWN_ROW, HUB_INTERACT_KEY,
    POI_TYPE_INVENTORY, POI_TYPE_SHOP, POI_TYPE_DUNGEON, POI_TYPE_HIGH_SCORES,
    SHOP_HEAL_COST, SHOP_HEAL_AMOUNT, TILE_SIZE, HUD_HEIGHT,
} from '../constants.js';
import Renderer from '../rendering/Renderer.js';
import CollisionSystem from '../systems/CollisionSystem.js';
import BombSystem from '../systems/BombSystem.js';
import AttractionSystem from '../systems/AttractionSystem.js';
import RageSystem from '../systems/RageSystem.js';
import ScoreSystem from '../systems/ScoreSystem.js';
import LevelSystem from '../systems/LevelSystem.js';
import ExperienceSystem from '../systems/ExperienceSystem.js';
import SaveSystem from '../systems/SaveSystem.js';
import DropSystem from '../systems/DropSystem.js';
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
        this.dropSystem = new DropSystem();
        this.soundEngine = new SoundEngine();
        this.goldDrops = []; // Drops de ouro no level (Fase 20)

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

        // HUB explorável (Fase 23 + Fase 26)
        this.hubPOIs = [];
        this.hubDecorations = [];
        this.hubSubState = null; // null | 'inventory' | 'shop' | 'dungeon_confirm' | 'high_scores'
        this.hubDungeonConfirmSelection = 0; // 0 = Sim, 1 = Não

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
        EventBus.on('drop:spawned', ({ col, row, value }) => {
            this.goldDrops.push({ col, row, value });
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
        // Sub-telas: processar apenas input da tela e Escape para fechar
        if (this.hubSubState === 'inventory') {
            if (this.input.wasPressed('Escape')) {
                this.hubSubState = null;
                this.soundEngine.play('menuSelect');
            }
            return;
        }
        if (this.hubSubState === 'shop') {
            if (this.input.wasPressed('Escape')) {
                this.hubSubState = null;
                this.soundEngine.play('menuSelect');
            }
            if (this.input.wasPressed('Enter') || this.input.wasPressed('Space')) {
                const gold = this.player.gold != null ? this.player.gold : 0;
                if (gold >= SHOP_HEAL_COST && this.player.hp < this.player.maxHp) {
                    this.player.gold = gold - SHOP_HEAL_COST;
                    this.player.hp = Math.min(this.player.maxHp, this.player.hp + SHOP_HEAL_AMOUNT);
                    this.soundEngine.play('powerup');
                }
            }
            return;
        }
        if (this.hubSubState === 'dungeon_confirm') {
            if (this.input.wasPressed('ArrowUp') || this.input.wasPressed('KeyW')) {
                this.hubDungeonConfirmSelection = 0;
                this.soundEngine.play('menuSelect');
            }
            if (this.input.wasPressed('ArrowDown') || this.input.wasPressed('KeyS')) {
                this.hubDungeonConfirmSelection = 1;
                this.soundEngine.play('menuSelect');
            }
            if (this.input.wasPressed('Enter') || this.input.wasPressed('Space')) {
                if (this.hubDungeonConfirmSelection === 0) {
                    this.hubSubState = null;
                    this._enterDungeon();
                } else {
                    this.hubSubState = null;
                    this.hubDungeonConfirmSelection = 0;
                    this.soundEngine.play('menuSelect');
                }
            }
            if (this.input.wasPressed('Escape')) {
                this.hubSubState = null;
                this.hubDungeonConfirmSelection = 0;
                this.soundEngine.play('menuSelect');
            }
            return;
        }
        if (this.hubSubState === 'high_scores') {
            if (this.input.wasPressed('Escape')) {
                this.hubSubState = null;
                this.soundEngine.play('menuSelect');
            }
            return;
        }

        // High Scores por tecla H em qualquer lugar do HUB
        if (this.input.wasPressed('KeyH')) {
            this.hubSubState = 'high_scores';
            this.soundEngine.play('menuSelect');
            return;
        }

        // Interação com POI (tecla E)
        const nearPOI = this._getHubPOINearPlayer();
        if (nearPOI && this.input.wasPressed(HUB_INTERACT_KEY)) {
            this.soundEngine.play('menuSelect');
            if (nearPOI.type === POI_TYPE_INVENTORY) {
                this.hubSubState = 'inventory';
            } else if (nearPOI.type === POI_TYPE_SHOP) {
                this.hubSubState = 'shop';
            } else if (nearPOI.type === POI_TYPE_DUNGEON) {
                this.hubSubState = 'dungeon_confirm';
                this.hubDungeonConfirmSelection = 0;
            } else if (nearPOI.type === POI_TYPE_HIGH_SCORES) {
                this.hubSubState = 'high_scores';
            }
            return;
        }

        // Movimento no level do HUB
        this._updateHubMovement(dt);
        // Atualizar apenas animTimer do jogador para os sprites de direção/anda atualizarem (sem chamar o behavior para não duplicar movimento nem colocar bombas)
        if (this.player) {
            if (this.player.moving) {
                this.player.animTimer += dt;
            } else {
                this.player.animTimer = 0;
            }
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
            goldDrops: this.goldDrops,
        };

        this.entityManager.update(dt, context);
        this.bombSystem.update(dt, context);
        this.attractionSystem.update(dt);
        this.rageSystem.update(dt);
        this.dropSystem.update(context);
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
        this.hubSubState = null;
        this.hubDungeonConfirmSelection = 0;
        this._loadHubLevel();

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

    _loadHubLevel() {
        this.entityManager.clear();
        this.grid.clear();
        this.renderer.particleSystem.clear();

        const { pois, decorations } = HubLevelGenerator.generate(this.grid);
        this.hubPOIs = pois;
        this.hubDecorations = decorations;

        this.renderer.backgroundLayer.rebuild(this.grid, 'hub', 0);

        const spawnX = gridToPixelX(HUB_SPAWN_COL);
        const spawnY = gridToPixelY(HUB_SPAWN_ROW);
        if (!this.player) {
            this.player = new Player(spawnX, spawnY, new PlayerControlBehavior());
        } else {
            this.player.x = spawnX;
            this.player.y = spawnY;
        }
        this.entityManager.add(this.player, 'player');
    }

    /** Retorna o POI na célula do jogador ou em célula adjacente (para interação). */
    _getHubPOINearPlayer() {
        if (!this.player || !this.hubPOIs.length) return null;
        const pc = pixelToGridCol(this.player.x);
        const pr = pixelToGridRow(this.player.y);
        for (const poi of this.hubPOIs) {
            const dist = Math.abs(poi.col - pc) + Math.abs(poi.row - pr);
            if (dist <= 1) return poi;
        }
        return null;
    }

    /** Movimento do jogador no HUB (apenas colisão com grid, sem bombas). */
    _updateHubMovement(dt) {
        if (!this.player) return;
        let dx = 0, dy = 0;
        if (this.input.left) dx = -1;
        else if (this.input.right) dx = 1;
        if (this.input.up) dy = -1;
        else if (this.input.down) dy = 1;
        if (dx !== 0 && dy !== 0) dy = 0;

        this.player.moving = dx !== 0 || dy !== 0;
        if (dx !== 0) this.player.direction = dx < 0 ? 'left' : 'right';
        else if (dy !== 0) this.player.direction = dy < 0 ? 'up' : 'down';

        if (dx === 0 && dy === 0) return;

        const halfTile = TILE_SIZE / 2;
        const margin = 3;
        const entityHalf = halfTile - margin;
        let nx = this.player.x + dx * this.player.speed * dt;
        let ny = this.player.y + dy * this.player.speed * dt;
        const ox = this.player.x;
        const oy = this.player.y;

        if (dx !== 0) {
            const edgeX = nx + dx * entityHalf;
            const col = pixelToGridCol(edgeX);
            const currentRow = pixelToGridRow(oy);
            if (this.grid.isSolid(col, currentRow)) {
                nx = dx > 0 ? col * TILE_SIZE - entityHalf : (col + 1) * TILE_SIZE + entityHalf;
            }
            // Ajuste fino de Y para alinhar ao tile (corner sliding)
            const centerY = gridToPixelY(currentRow);
            const diff = centerY - oy;
            if (Math.abs(diff) > 2) {
                ny = oy + Math.sign(diff) * Math.min(Math.abs(diff), this.player.speed * 0.016);
            } else {
                ny = oy;
            }
        } else if (dy !== 0) {
            const edgeY = ny + dy * entityHalf;
            const row = pixelToGridRow(edgeY);
            const currentCol = pixelToGridCol(ox);
            if (this.grid.isSolid(currentCol, row)) {
                ny = dy > 0 ? row * TILE_SIZE + HUD_HEIGHT - entityHalf : (row + 1) * TILE_SIZE + HUD_HEIGHT + entityHalf;
            }
            const centerX = gridToPixelX(currentCol);
            const diff = centerX - ox;
            if (Math.abs(diff) > 2) {
                nx = ox + Math.sign(diff) * Math.min(Math.abs(diff), this.player.speed * 0.016);
            } else {
                nx = ox;
            }
        }

        this.player.x = nx;
        this.player.y = ny;
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

        this.goldDrops = [];
        this.dropSystem.init(this.currentLevelSeed);

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
            // HUB explorável (Fase 23 + Fase 26)
            hubPOIs: this.hubPOIs,
            hubDecorations: this.hubDecorations,
            hubSubState: this.hubSubState,
            hubNearPOI: this.state === STATE_HUB ? this._getHubPOINearPlayer() : null,
            hubDungeonConfirmSelection: this.hubDungeonConfirmSelection,
            goldDrops: this.goldDrops,
        };
        this.renderer.render(renderContext);
    }
}
