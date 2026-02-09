import Entity from './Entity.js';
import { PLAYER_SPEED, PLAYER_MAX_BOMBS, PLAYER_BOMB_RANGE, PLAYER_MAX_HP, PLAYER_START_HP, INVINCIBILITY_TIME_DAMAGE, PLAYER_DEFENSE_START, PLAYER_ATTACK_POWER_START, PLAYER_CRIT_CHANCE_START, PLAYER_START_BOMB_INVENTORY, PLAYER_MAX_BOMB_INVENTORY } from '../constants.js';

export default class Player extends Entity {
    constructor(x, y, behavior) {
        super(x, y);
        this.type = 'player';
        this.behavior = behavior;

        this.speed = PLAYER_SPEED;
        this.maxBombs = PLAYER_MAX_BOMBS;
        this.bombRange = PLAYER_BOMB_RANGE;
        this.activeBombs = 0; // Mantido para rastreamento/compatibilidade, mas não limita quantidade

        // Inventory System (Fase 16)
        this.bombInventory = PLAYER_START_BOMB_INVENTORY; // Bombas disponíveis no inventário
        this.maxBombInventory = PLAYER_MAX_BOMB_INVENTORY; // Capacidade máxima do inventário

        // HP System
        this.maxHp = PLAYER_MAX_HP;
        this.hp = PLAYER_START_HP;

        // RPG System
        this.level = 1;
        this.xp = 0;

        // RPG Stats
        this.defense = PLAYER_DEFENSE_START;      // Redução de dano (%)
        this.attackPower = PLAYER_ATTACK_POWER_START; // Multiplicador de dano
        this.critChance = PLAYER_CRIT_CHANCE_START;  // Chance de crítico (%)

        this.direction = 'down'; // 'up', 'down', 'left', 'right'
        this.moving = false;
        this.animTimer = 0;

        this.invincible = false;
        this.invincibleTimer = 0;

        // Physical Attack System
        this.attackCooldown = 0; // Timer de cooldown do ataque físico
    }

    update(dt, context) {
        super.update(dt, context);

        // Atualizar cooldown do ataque físico
        if (this.attackCooldown > 0) {
            this.attackCooldown -= dt;
        }

        if (this.invincible) {
            this.invincibleTimer -= dt;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }

        if (this.moving) {
            this.animTimer += dt;
        } else {
            this.animTimer = 0;
        }
    }

    takeDamage(amount, soundEngine) {
        if (this.invincible || !this.alive) return { died: false, damage: 0 };

        // Aplicar defense (redução percentual)
        const damageReduction = this.defense / 100;
        const actualDamage = Math.max(1, Math.floor(amount * (1 - damageReduction)));

        this.hp = Math.max(0, this.hp - actualDamage);

        if (this.hp <= 0) {
            this.alive = false;
            return { died: true, damage: actualDamage };
        }

        // Activate temporary invincibility
        this.invincible = true;
        this.invincibleTimer = INVINCIBILITY_TIME_DAMAGE;

        if (soundEngine) soundEngine.play('playerHit');
        return { died: false, damage: actualDamage };
    }
}
