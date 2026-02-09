import { COLS, ROWS, CELL_EMPTY, CELL_WALL, CELL_BRICK, LEVEL_CONFIG, POWERUP_TYPES, DUNGEON_SEED_BASE, DUNGEON_SEED_OFFSET } from '../constants.js';
import { floodFill } from '../utils.js';
import PRNG from '../utils/PRNG.js';

export default class DungeonGenerator {
    /**
     * Gera dungeon baseado em seed
     * @param {Grid} grid - Grid a ser preenchido
     * @param {number} level - Nível do dungeon
     * @param {number|string} seed - Seed para geração (pode ser número ou string)
     * @param {Object} config - Configuração opcional de geração
     * @returns {Object} Objeto com seed, seedString e config
     */
    static generate(grid, level, seed, config = {}) {
        // Converter seed string para número se necessário
        const seedNum = typeof seed === 'string' 
            ? this._stringToSeed(seed) 
            : (seed || this._generateSeed(level));
        
        const prng = new PRNG(seedNum);
        
        // Configuração padrão com variação baseada em seed
        const levelConfig = LEVEL_CONFIG[level] || { density: 0.75 };
        const genConfig = {
            brickDensity: config.brickDensity ?? this._calculateDensity(level, prng),
            powerupRatio: config.powerupRatio ?? 0.2,
            enemyCount: config.enemyCount ?? null,
            enemyTypes: config.enemyTypes ?? null,
            ...config
        };

        grid.clear();

        // 1. Bordas como paredes (fixo)
        this._generateBorders(grid);

        // 2. Pilares fixos (padrão clássico)
        this._generatePillars(grid);

        // 3. Zonas seguras
        const safeZones = this._getSafeZones();

        // 4. Gerar blocos baseado em seed
        this._generateBricks(grid, prng, genConfig, safeZones);

        // 5. Validar e garantir reachability
        this._ensureReachability(grid, safeZones);

        // 6. Colocar powerups baseado em seed
        // REMOVIDO NA FASE 11: Power-ups serão substituídos por drops na Fase 13
        // this._placePowerups(grid, prng, genConfig);

        // Escolher tema baseado em seed para consistência
        const themes = ['ruins', 'subway', 'hospital', 'factory', 'school', 'supermarket'];
        const themeIndex = prng.int(0, themes.length);
        const theme = themes[themeIndex];

        return {
            seed: seedNum,
            seedString: this._seedToString(seedNum),
            config: genConfig,
            theme: theme  // Novo: tema da dungeon
        };
    }

    static _generateBorders(grid) {
        // Borders as walls
        for (let c = 0; c < COLS; c++) {
            grid.setCell(c, 0, CELL_WALL);
            grid.setCell(c, ROWS - 1, CELL_WALL);
        }
        for (let r = 0; r < ROWS; r++) {
            grid.setCell(0, r, CELL_WALL);
            grid.setCell(COLS - 1, r, CELL_WALL);
        }
    }

    static _generatePillars(grid) {
        // Fixed pillars at even positions (classic survival pattern)
        for (let c = 2; c < COLS - 1; c += 2) {
            for (let r = 2; r < ROWS - 1; r += 2) {
                grid.setCell(c, r, CELL_WALL);
            }
        }
    }

    static _getSafeZones() {
        // Safe zones (keep empty around player and enemy spawns)
        return [
            // Player spawn (top-left)
            [1, 1], [2, 1], [1, 2],
            // Enemy spawn corners
            [COLS - 2, 1], [COLS - 3, 1], [COLS - 2, 2],
            [1, ROWS - 2], [2, ROWS - 2], [1, ROWS - 3],
            [COLS - 2, ROWS - 2], [COLS - 3, ROWS - 2], [COLS - 2, ROWS - 3],
        ];
    }

    static _generateBricks(grid, prng, config, safeZones) {
        const safeSet = new Set(safeZones.map(([c, r]) => `${c},${r}`));
        const candidates = [];

        for (let c = 1; c < COLS - 1; c++) {
            for (let r = 1; r < ROWS - 1; r++) {
                if (grid.getCell(c, r) !== CELL_EMPTY) continue;
                if (safeSet.has(`${c},${r}`)) continue;
                candidates.push([c, r]);
            }
        }

        // Shuffle usando PRNG
        const shuffled = prng.shuffle(candidates);
        const brickCount = Math.floor(candidates.length * config.brickDensity);
        
        for (let i = 0; i < brickCount; i++) {
            const [c, r] = shuffled[i];
            grid.setCell(c, r, CELL_BRICK);
        }
    }

    static _ensureReachability(grid, safeZones) {
        // Ensure all safe zone corners are reachable from player spawn (1,1)
        const targets = [
            [COLS - 2, 1],
            [1, ROWS - 2],
            [COLS - 2, ROWS - 2],
        ];

        for (const [tc, tr] of targets) {
            const reachable = floodFill(grid, 1, 1);
            if (reachable.has(`${tc},${tr}`)) continue;

            // Carve a path from (1,1) to (tc,tr)
            this._carvePath(grid, 1, 1, tc, tr);
        }
    }

    static _carvePath(grid, sc, sr, tc, tr) {
        let c = sc, r = sr;
        while (c !== tc || r !== tr) {
            if (c < tc) c++;
            else if (c > tc) c--;
            else if (r < tr) r++;
            else if (r > tr) r--;

            if (grid.getCell(c, r) === CELL_BRICK) {
                grid.setCell(c, r, CELL_EMPTY);
            } else if (grid.getCell(c, r) === CELL_WALL && !(c % 2 === 0 && r % 2 === 0)) {
                // Don't destroy fixed pillars, go around
                if (c !== tc) {
                    // Try moving vertically first
                    const detourR = r + (r < tr ? 1 : -1);
                    if (grid.getCell(c, detourR) === CELL_BRICK) {
                        grid.setCell(c, detourR, CELL_EMPTY);
                    }
                }
            }
        }
    }

    static _placePowerups(grid, prng, config) {
        const brickCells = [];
        for (let c = 1; c < COLS - 1; c++) {
            for (let r = 1; r < ROWS - 1; r++) {
                if (grid.getCell(c, r) === CELL_BRICK) {
                    brickCells.push([c, r]);
                }
            }
        }

        const shuffled = prng.shuffle(brickCells);
        const count = Math.max(3, Math.floor(brickCells.length * config.powerupRatio));
        
        for (let i = 0; i < count && i < shuffled.length; i++) {
            const [c, r] = shuffled[i];
            const type = prng.choice(POWERUP_TYPES);
            grid.setPowerup(c, r, type);
        }
    }

    /**
     * Converter string para seed numérica
     * @param {string} str - String a ser convertida
     * @returns {number} Seed numérica
     */
    static _stringToSeed(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    /**
     * Converter seed numérica para string legível
     * @param {number} seed - Seed numérica
     * @returns {string} String representando a seed
     */
    static _seedToString(seed) {
        // Converter para base36 para string mais curta
        return seed.toString(36).toUpperCase();
    }

    /**
     * Gerar seed baseada no nível (compatibilidade)
     * @param {number} level - Nível do dungeon
     * @returns {number} Seed gerada
     */
    static _generateSeed(level) {
        // Seed base pode ser level * constante + offset
        return level * DUNGEON_SEED_BASE + DUNGEON_SEED_OFFSET;
    }

    /**
     * Calcular density com variação baseada em seed
     * @param {number} level - Nível do dungeon
     * @param {PRNG} prng - Gerador PRNG
     * @returns {number} Density calculada
     */
    static _calculateDensity(level, prng) {
        const baseDensity = LEVEL_CONFIG[level]?.density || 0.75;
        // Variação de ±5% baseada em seed
        const variation = (prng.random() - 0.5) * 0.1;
        return Math.max(0.5, Math.min(0.9, baseDensity + variation));
    }
}
