import Entity from './Entity.js';
import { LEVEL_CONFIG, ENEMY_HP_WANDERER, ENEMY_HP_CHASER, ENEMY_HP_SMART, 
         ENEMY_HIT_FLASH_DURATION, KNOCKBACK_FORCE, KNOCKBACK_DURATION, 
         KNOCKBACK_FRICTION } from '../constants.js';
import EventBus from '../core/EventBus.js';

export default class Enemy extends Entity {
    constructor(x, y, behavior, enemyType, level) {
        super(x, y);
        this.type = 'enemy';
        this.behavior = behavior;
        this.enemyType = enemyType; // 'wanderer', 'chaser', 'smart'
        this.speed = LEVEL_CONFIG[level]?.speed || 60;
        this.direction = 'down';
        this.moving = false;
        this.animTimer = 0;

        // HP System
        this.maxHp = this._getMaxHpForType(enemyType);
        this.hp = this.maxHp;

        // Hit flash effect
        this.hitFlash = false;
        this.hitFlashTimer = 0;

        // Knockback System
        this.knockbackX = 0; // Velocidade horizontal de knockback
        this.knockbackY = 0; // Velocidade vertical de knockback
        this.knockbackTimer = 0; // Timer do knockback
        this.isKnockedBack = false; // Flag para indicar se está em knockback
    }

    update(dt, context) {
        super.update(dt, context);

        // Processar knockback
        if (this.isKnockedBack && this.knockbackTimer > 0) {
            this.knockbackTimer -= dt;
            
            // Aplicar fricção ao knockback
            const friction = KNOCKBACK_FRICTION * dt;
            if (this.knockbackX > 0) {
                this.knockbackX = Math.max(0, this.knockbackX - friction);
            } else if (this.knockbackX < 0) {
                this.knockbackX = Math.min(0, this.knockbackX + friction);
            }
            if (this.knockbackY > 0) {
                this.knockbackY = Math.max(0, this.knockbackY - friction);
            } else if (this.knockbackY < 0) {
                this.knockbackY = Math.min(0, this.knockbackY + friction);
            }
            
            // Mover inimigo com knockback
            this.x += this.knockbackX * dt;
            this.y += this.knockbackY * dt;
            
            // Finalizar knockback quando timer acabar ou velocidade muito baixa
            if (this.knockbackTimer <= 0 || 
                (Math.abs(this.knockbackX) < 5 && Math.abs(this.knockbackY) < 5)) {
                this.isKnockedBack = false;
                this.knockbackX = 0;
                this.knockbackY = 0;
            }
        }

        // Hit flash timer
        if (this.hitFlash) {
            this.hitFlashTimer -= dt;
            if (this.hitFlashTimer <= 0) {
                this.hitFlash = false;
            }
        }

        // Não processar movimento normal durante knockback
        if (!this.isKnockedBack && this.moving) {
            this.animTimer += dt;
        }
    }

    _getMaxHpForType(enemyType) {
        switch (enemyType) {
            case 'chaser': return ENEMY_HP_CHASER;
            case 'smart': return ENEMY_HP_SMART;
            default: return ENEMY_HP_WANDERER;
        }
    }

    takeDamage(amount, soundEngine, level, knockbackDirection = null) {
        if (!this.alive) return false;

        this.hp = Math.max(0, this.hp - amount);

        if (this.hp <= 0) {
            this.alive = false;
            EventBus.emit('enemy:killed', { enemy: this, level });
            if (soundEngine) soundEngine.play('enemyKilled');
            return true; // died
        }

        // Survived - activate hit flash
        this.hitFlash = true;
        this.hitFlashTimer = ENEMY_HIT_FLASH_DURATION;

        // Aplicar knockback se direção foi fornecida (dano físico)
        if (knockbackDirection) {
            this.setKnockbackDirection(knockbackDirection.x, knockbackDirection.y);
        }

        EventBus.emit('enemy:hit', { enemy: this, damage: amount });
        if (soundEngine) soundEngine.play('enemyHit');
        return false; // still alive
    }

    setKnockbackDirection(directionX, directionY) {
        // Normalizar direção
        const length = Math.sqrt(directionX * directionX + directionY * directionY);
        if (length > 0) {
            directionX /= length;
            directionY /= length;
        }
        
        // Aplicar força de knockback
        this.knockbackX = directionX * KNOCKBACK_FORCE;
        this.knockbackY = directionY * KNOCKBACK_FORCE;
        this.knockbackTimer = KNOCKBACK_DURATION;
        this.isKnockedBack = true;
    }
}
