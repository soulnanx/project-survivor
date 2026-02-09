import Entity from './Entity.js';
import { LEVEL_CONFIG, ENEMY_HP_WANDERER, ENEMY_HP_CHASER, ENEMY_HP_SMART, 
         ENEMY_HIT_FLASH_DURATION, KNOCKBACK_FORCE, KNOCKBACK_DURATION, 
         KNOCKBACK_FRICTION,
         RAGE_SPEED_MULTIPLIER_BASE, RAGE_SPEED_MULTIPLIER_PER_LEVEL,
         MAX_RAGE_SPEED_MULTIPLIER, RAGE_TRANSITION_TIME,
         RAGE_DURATION_PAUSE, RAGE_COOLDOWN, RAGE_VISUAL_FADE_TIME } from '../constants.js';
import EventBus from '../core/EventBus.js';
import { pixelToGridCol, pixelToGridRow, lerp } from '../utils.js';

export default class Enemy extends Entity {
    constructor(x, y, behavior, enemyType, level) {
        super(x, y);
        this.type = 'enemy';
        this.behavior = behavior;
        this.enemyType = enemyType; // 'wanderer', 'chaser', 'smart'
        this.speed = LEVEL_CONFIG[level]?.speed || 60;
        this.originalSpeed = this.speed; // Initialize originalSpeed
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

        // Rage System
        this.isRaging = false;
        this.rageTimer = 0;
        this.ragePhase = 'none'; // 'moving' | 'paused' | 'none'
        this.rageTarget = null; // {col, row, cells}
        this.rageSpeed = 0;
        this.rageTransitionTimer = 0;
        this.rageCooldownTimer = 0;
        this.hasReachedTarget = false;
        this.rageVisualIntensity = 0;
        this.level = level; // Store level for rage speed calculation
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

        // Atualiza rage
        if (this.isRaging) {
            this._updateRage(dt, context);
        }

        // Atualiza cooldown
        if (this.rageCooldownTimer > 0) {
            this.rageCooldownTimer -= dt;
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

    /**
     * Start rage mode triggered by bomb explosion
     * @param {Object} target - {col, row, cells} explosion target
     * @param {number} duration - Total duration in seconds
     * @param {Object} rageSystem - RageSystem instance for helper methods
     * @returns {boolean} True if rage was started, false if ignored
     */
    startRage(target, duration, rageSystem) {
        // Verifica cooldown
        if (this.rageCooldownTimer > 0) return false;
        
        // Se já está em pausa, só reage se nova explosão estiver 20% mais próxima
        if (this.ragePhase === 'paused' && this.rageTarget) {
            const currentDist = Math.abs(pixelToGridCol(this.x) - this.rageTarget.col) + 
                               Math.abs(pixelToGridRow(this.y) - this.rageTarget.row);
            const newDist = Math.abs(pixelToGridCol(this.x) - target.col) + 
                           Math.abs(pixelToGridRow(this.y) - target.row);
            
            if (newDist >= currentDist * 0.8) {
                return false; // Ignora nova explosão
            }
        }
        
        // Se está em movimento, cancela e vai para nova explosão
        if (this.ragePhase === 'moving') {
            this.rageTimer = duration;
            this.rageTarget = target;
            this.hasReachedTarget = false;
            return true;
        }
        
        // Inicia nova rage
        this.isRaging = true;
        this.rageTimer = duration;
        this.rageTarget = target;
        this.ragePhase = 'moving';
        this.hasReachedTarget = false;
        this.rageTransitionTimer = 0;
        
        // Salva velocidade original se ainda não foi salva
        if (this.originalSpeed === this.speed || this.originalSpeed === 0) {
            this.originalSpeed = this.speed;
        }
        
        // Calcula velocidade de rage
        const speedMultiplier = this._getRageSpeedMultiplier();
        this.rageSpeed = this.originalSpeed * speedMultiplier;
        
        EventBus.emit('zombie:rage_start', { zombie: this });
        return true;
    }

    /**
     * Get rage speed multiplier based on level
     * @returns {number} Speed multiplier
     */
    _getRageSpeedMultiplier() {
        // Base multiplier
        let multiplier = RAGE_SPEED_MULTIPLIER_BASE;
        
        // Add per-level bonus if level is available
        if (this.level) {
            multiplier = 1.2 + (this.level * RAGE_SPEED_MULTIPLIER_PER_LEVEL);
        }
        
        // Cap máximo
        return Math.min(multiplier, MAX_RAGE_SPEED_MULTIPLIER);
    }

    /**
     * Update rage state
     * @param {number} dt - Delta time in seconds
     * @param {Object} context - Game context
     */
    _updateRage(dt, context) {
        if (!this.alive) {
            // Cancel rage if zombie dies
            this._endRage();
            return;
        }

        this.rageTimer -= dt;
        this.rageTransitionTimer += dt;
        
        // Transição suave de velocidade
        if (this.rageTransitionTimer < RAGE_TRANSITION_TIME) {
            const t = Math.min(1.0, this.rageTransitionTimer / RAGE_TRANSITION_TIME);
            this.speed = lerp(this.originalSpeed, this.rageSpeed, t);
            this.rageVisualIntensity = lerp(0, 0.7, t);
        } else {
            this.speed = this.rageSpeed;
        }
        
        // Verifica se chegou no target
        if (this.ragePhase === 'moving' && !this.hasReachedTarget && this.rageTarget) {
            const zombieCol = pixelToGridCol(this.x);
            const zombieRow = pixelToGridRow(this.y);
            
            // Check if reached target
            const distance = Math.abs(zombieCol - this.rageTarget.col) + 
                           Math.abs(zombieRow - this.rageTarget.row);
            
            if (distance <= 1) {
                // Also check if in any explosion cell
                const inExplosionCell = this.rageTarget.cells && 
                    this.rageTarget.cells.some(cell => 
                        cell.col === zombieCol && cell.row === zombieRow
                    );
                
                if (inExplosionCell || distance <= 1) {
                    this.hasReachedTarget = true;
                    this.ragePhase = 'paused';
                    this.moving = false;
                    this.rageVisualIntensity = 1.0;
                    EventBus.emit('zombie:rage_arrived', { zombie: this });
                }
            }
        }
        
        // Transição para pausa se tempo acabou
        if (this.ragePhase === 'moving' && this.rageTimer <= RAGE_DURATION_PAUSE) {
            this.ragePhase = 'paused';
            this.moving = false;
            this.rageTimer = RAGE_DURATION_PAUSE; // Tempo restante para pausa
            this.rageVisualIntensity = 1.0;
        }
        
        // Fade out de velocidade ao sair
        if (this.rageTimer <= 0) {
            const fadeTime = RAGE_VISUAL_FADE_TIME;
            const transitionEndTime = RAGE_TRANSITION_TIME;
            
            if (this.rageTransitionTimer < transitionEndTime + fadeTime) {
                const fadeStart = transitionEndTime;
                const t = Math.max(0, (this.rageTransitionTimer - fadeStart) / fadeTime);
                
                // Fade out velocidade
                this.speed = lerp(this.rageSpeed, this.originalSpeed, Math.min(1.0, t));
                
                // Fade out visual
                this.rageVisualIntensity = lerp(1.0, 0.0, Math.min(1.0, t));
            } else {
                // Termina rage
                this._endRage();
            }
        }
    }

    /**
     * End rage mode and return to normal
     */
    _endRage() {
        this.isRaging = false;
        this.ragePhase = 'none';
        this.speed = this.originalSpeed;
        this.rageCooldownTimer = RAGE_COOLDOWN;
        this.rageTransitionTimer = 0;
        this.rageVisualIntensity = 0;
        this.rageTarget = null;
        this.hasReachedTarget = false;
    }
}
