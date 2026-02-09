import EventBus from '../core/EventBus.js';
import { PLAYER_DEFENSE_MAX, PLAYER_CRIT_CHANCE_MAX } from '../constants.js';

// Tabela de XP por nível (progressão exponencial)
const XP_TABLE = [
    0,     // level 1
    100,   // level 2
    250,   // level 3
    450,   // level 4
    700,   // level 5
    1000,  // level 6
    1400,  // level 7
    1900,  // level 8
    2500,  // level 9
    3200,  // level 10
];

// XP por tipo de inimigo
const XP_REWARDS = {
    wanderer: 10,
    chaser: 20,
    smart: 35,
};

export default class ExperienceSystem {
    constructor() {
        this.player = null;
        this._setupEvents();
    }

    _setupEvents() {
        EventBus.on('enemy:killed', ({ enemy }) => {
            this._grantXP(enemy);
        });
    }

    _grantXP(enemy) {
        if (!this.player) return;

        const xpGain = XP_REWARDS[enemy.enemyType] || 10;
        this.player.xp += xpGain;

        EventBus.emit('xp:gained', { amount: xpGain, player: this.player });

        // Check level up
        this._checkLevelUp();
    }

    _checkLevelUp() {
        if (!this.player) return;

        while (this.player.level < XP_TABLE.length && 
               this.player.xp >= XP_TABLE[this.player.level]) {
            this.player.level++;
            this._applyLevelUpBonuses();
            EventBus.emit('player:levelup', { player: this.player, level: this.player.level });
        }
    }

    _applyLevelUpBonuses() {
        if (!this.player) return;

        // Bonuses existentes
        this.player.maxHp += 5;           // +5 HP máximo
        this.player.hp = this.player.maxHp;    // Full heal
        this.player.speed += 5;           // +5 velocidade

        // Novos bonuses de stats
        // Defense: +2% a cada level (máximo 80%)
        this.player.defense = Math.min(PLAYER_DEFENSE_MAX, 
            this.player.defense + 2);
        
        // Attack Power: +0.1 a cada 2 levels
        if (this.player.level % 2 === 0) {
            this.player.attackPower += 0.1;
        }
        
        // Crit Chance: +1% a cada 3 levels (máximo 50%)
        if (this.player.level % 3 === 0) {
            this.player.critChance = Math.min(PLAYER_CRIT_CHANCE_MAX,
                this.player.critChance + 1);
        }

        // Bonuses existentes de bomb range e max bombs
        if (this.player.level % 2 === 0) {
            this.player.bombRange++;
        }
        if (this.player.level % 3 === 0) {
            this.player.maxBombs++;
        }
    }

    update(context) {
        this.player = context.player;
    }
}

// Exportar XP_TABLE para uso na UI
export const XP_TABLE_EXPORT = XP_TABLE;
