import { COLS, ROWS, LEVEL_CONFIG, DUNGEON_SEED_BASE, DUNGEON_SEED_OFFSET } from '../constants.js';
import { gridToPixelX, gridToPixelY } from '../utils.js';
import Enemy from '../entities/Enemy.js';
import WandererBehavior from '../behaviors/WandererBehavior.js';
import ChaserBehavior from '../behaviors/ChaserBehavior.js';
import SmartBehavior from '../behaviors/SmartBehavior.js';
import EventBus from '../core/EventBus.js';
import PRNG from '../utils/PRNG.js';

const FIXED_SPAWN_POSITIONS = [
    { col: COLS - 2, row: 1 },
    { col: 1, row: ROWS - 2 },
    { col: COLS - 2, row: ROWS - 2 },
];

export default class LevelSystem {
    constructor() {
        this.levelCompleted = false;
    }

    spawnEnemies(level, grid, entityManager, seed = null) {
        this.levelCompleted = false;
        const config = LEVEL_CONFIG[level];
        if (!config) return;

        // Criar PRNG para spawn de inimigos
        const seedNum = seed || (level * DUNGEON_SEED_BASE + DUNGEON_SEED_OFFSET);
        const prng = new PRNG(seedNum);

        // Posições de spawn possíveis (expandir além dos 3 cantos fixos)
        const spawnPositions = this._getSpawnPositions(grid, prng, config.enemies);

        // Tipos de inimigos com distribuição baseada em seed
        const enemyTypes = this._distributeEnemyTypes(config, prng);

        for (let i = 0; i < config.enemies; i++) {
            const spawn = spawnPositions[i];
            const type = enemyTypes[i];

            let behavior;
            switch (type) {
                case 'chaser':
                    behavior = new ChaserBehavior();
                    break;
                case 'smart':
                    behavior = new SmartBehavior();
                    break;
                default:
                    behavior = new WandererBehavior();
            }

            const enemy = new Enemy(
                gridToPixelX(spawn.col),
                gridToPixelY(spawn.row),
                behavior,
                type,
                level
            );
            entityManager.add(enemy, 'enemies');
        }
    }

    _getSpawnPositions(grid, prng, count) {
        // Posições fixas (cantos) + posições aleatórias baseadas em seed
        const positions = [...FIXED_SPAWN_POSITIONS];

        // Adicionar posições aleatórias se necessário
        if (count > FIXED_SPAWN_POSITIONS.length) {
            const candidates = [];
            for (let c = 2; c < COLS - 2; c++) {
                for (let r = 2; r < ROWS - 2; r++) {
                    if (grid.isWalkable(c, r)) {
                        candidates.push({ col: c, row: r });
                    }
                }
            }
            const shuffled = prng.shuffle(candidates);
            positions.push(...shuffled.slice(0, count - FIXED_SPAWN_POSITIONS.length));
        }

        // Embaralhar todas as posições e pegar as primeiras 'count'
        return prng.shuffle(positions).slice(0, count);
    }

    _distributeEnemyTypes(config, prng) {
        const types = [];
        const availableTypes = config.types || ['wanderer'];
        
        for (let i = 0; i < config.enemies; i++) {
            types.push(prng.choice(availableTypes));
        }
        
        return types;
    }

    update(context) {
        if (this.levelCompleted) return;

        const { entityManager } = context;
        const enemies = entityManager.getLayer('enemies');
        const aliveEnemies = enemies.filter(e => e.alive);

        if (aliveEnemies.length === 0) {
            this.levelCompleted = true;
            EventBus.emit('level:complete', { level: context.level });
        }
    }
}
