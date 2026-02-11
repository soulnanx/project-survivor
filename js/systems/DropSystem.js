/**
 * Sistema de drops de ouro (Fase 20).
 * Brick: 5% fixo. Zumbi: 15–30% definido pelo seed. Valor: 1, 5 ou 10.
 * Escuta brick:destroyed e enemy:killed; emite drop:spawned.
 * No update, detecta coleta (player na mesma célula) e soma ouro ao player.
 */
import EventBus from '../core/EventBus.js';
import PRNG from '../utils/PRNG.js';
import { pixelToGridCol, pixelToGridRow } from '../utils.js';
import { CELL_WOOD, CELL_IRON_BARS, CELL_HARD_BRICK, WOOD_DROP_CHANCE, IRON_BARS_DROP_CHANCE, HARD_BRICK_DROP_CHANCE } from '../constants.js';

const GOLD_VALUES = [1, 5, 10]; // pequeno, médio, grande
const BRICK_DROP_CHANCE = 5;    // 5% fixo ao destruir brick
const ZOMBIE_DROP_CHANCE_MIN = 15;
const ZOMBIE_DROP_CHANCE_MAX = 30;

export default class DropSystem {
    constructor() {
        this.prng = null;
        this.zombieChancePercent = ZOMBIE_DROP_CHANCE_MIN;
        this._setupEvents();
    }

    _setupEvents() {
        EventBus.on('brick:destroyed', ({ col, row }) => {
            this._trySpawnGold(col, row, BRICK_DROP_CHANCE);
        });
        EventBus.on('block:broken', ({ col, row, type }) => {
            // Blocos especiais têm chances de drop melhores
            const chances = {
                [CELL_WOOD]: WOOD_DROP_CHANCE,
                [CELL_IRON_BARS]: IRON_BARS_DROP_CHANCE,
                [CELL_HARD_BRICK]: HARD_BRICK_DROP_CHANCE
            };
            if (chances[type]) {
                this._trySpawnGold(col, row, chances[type]);
            }
        });
        EventBus.on('enemy:killed', ({ enemy }) => {
            if (!enemy) return;
            const col = pixelToGridCol(enemy.x);
            const row = pixelToGridRow(enemy.y);
            this._trySpawnGold(col, row); // usa zombieChancePercent (15–30%)
        });
    }

    /**
     * Inicializa o sistema com a seed do level (determinístico).
     * @param {number} seed - Seed numérica do level
     */
    init(seed) {
        const s = seed != null ? seed : 0;
        this.prng = new PRNG(s);
        this.zombieChancePercent = this.prng.intInclusive(ZOMBIE_DROP_CHANCE_MIN, ZOMBIE_DROP_CHANCE_MAX);
    }

    /**
     * Tenta spawnar um drop de ouro na célula (roll de chance; valor 1, 5 ou 10).
     * chancePercentOverride: se informado (ex.: 5 para brick), usa esse valor; senão usa zombieChancePercent.
     */
    _trySpawnGold(col, row, chancePercentOverride = null) {
        if (!this.prng) return;
        const chance = chancePercentOverride != null ? chancePercentOverride : this.zombieChancePercent;
        const roll = this.prng.random() * 100;
        if (roll >= chance) return;
        const value = this.prng.choice(GOLD_VALUES);
        EventBus.emit('drop:spawned', { col, row, value });
    }

    /**
     * Atualiza coleta: se o player está na mesma célula que um drop, coleta e remove.
     * @param {Object} context - { player, goldDrops }
     */
    update(context) {
        const { player, goldDrops } = context;
        if (!player || !goldDrops || goldDrops.length === 0) return;

        const playerCol = pixelToGridCol(player.x);
        const playerRow = pixelToGridRow(player.y);

        for (let i = goldDrops.length - 1; i >= 0; i--) {
            const drop = goldDrops[i];
            if (drop.col === playerCol && drop.row === playerRow) {
                player.gold = (player.gold || 0) + drop.value;
                goldDrops.splice(i, 1);
                EventBus.emit('drop:collected', { type: 'gold', value: drop.value });
            }
        }
    }
}
