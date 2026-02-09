import {
    TILE_SIZE, HUD_HEIGHT,
    COLOR_PLAYER, COLOR_BOMB, COLOR_EXPLOSION,
    COLOR_ENEMY_WANDERER, COLOR_ENEMY_CHASER, COLOR_ENEMY_SMART,
    COLOR_POWERUP_BOMB, COLOR_POWERUP_FLAME, COLOR_POWERUP_SPEED, COLOR_POWERUP_HEALTH,
    POWERUP_BOMB, POWERUP_FLAME, POWERUP_SPEED, POWERUP_HEALTH,
    SPRITE_SIZE, SPRITE_ANIMATION_FPS, SPRITE_IDLE_FRAME, SPRITE_FRAME_COUNT,
    SLASH_FRAME_COUNT, SLASH_ANIMATION_DURATION,
    ZOMBIE_SPRITE_SIZE, ZOMBIE_ANIMATION_FPS, ZOMBIE_IDLE_FRAME, ZOMBIE_FRAME_COUNT
} from '../constants.js';
import { pixelToGridCol, pixelToGridRow } from '../utils.js';
import SpriteLoader from './SpriteLoader.js';
import ZombieLoader from './ZombieLoader.js';

export default class EntityRenderer {
    constructor() {
        this.spriteLoader = new SpriteLoader();
        this.spriteLoader.loadPlayerSprites();  // Start loading (non-blocking)

        this.zombieLoader = new ZombieLoader();
        this.zombieLoader.loadZombieSprites();  // Start loading (non-blocking)
    }

    drawPlayer(ctx, player) {
        if (!player || !player.alive) return;

        const { invincible, invincibleTimer } = player;

        // Invincibility blink (preserve existing behavior)
        if (invincible && Math.floor(invincibleTimer * 10) % 2 === 0) return;

        // Try sprite rendering first, fallback to procedural
        if (this.spriteLoader.isReady()) {
            this._drawPlayerSprite(ctx, player);
        } else {
            this._drawPlayerProcedural(ctx, player);
        }
    }

    _drawPlayerSprite(ctx, player) {
        const { x, y, direction, animTimer, moving } = player;

        // Fase 18: durante animação de slash (ataque F), priorizar sprites slash
        let sprite = null;
        if (player.slashAnimTimer > 0) {
            const elapsed = SLASH_ANIMATION_DURATION - player.slashAnimTimer;
            const progress = Math.min(1, elapsed / SLASH_ANIMATION_DURATION);
            const slashFrame = Math.min(SLASH_FRAME_COUNT, 1 + Math.floor(progress * SLASH_FRAME_COUNT));
            sprite = this.spriteLoader.getSlashSprite(direction, slashFrame);
        }
        if (!sprite) {
            // Walk/idle
            const frameIndex = this._calculateSpriteFrame(animTimer, moving);
            sprite = this.spriteLoader.getSprite(direction, frameIndex);
        }

        if (!sprite) {
            console.warn(`Sprite not found: player_${direction}_*`);
            this._drawPlayerProcedural(ctx, player);
            return;
        }

        // Scale 64x64 sprite to fit TILE_SIZE (48px)
        const scale = TILE_SIZE / SPRITE_SIZE;  // 48 / 64 = 0.75
        const drawWidth = SPRITE_SIZE * scale;
        const drawHeight = SPRITE_SIZE * scale;

        // Center on player position
        const drawX = x - drawWidth / 2;
        const drawY = y - drawHeight / 2;

        ctx.drawImage(sprite, drawX, drawY, drawWidth, drawHeight);
    }

    _calculateSpriteFrame(animTimer, moving) {
        if (!moving) {
            return SPRITE_IDLE_FRAME;  // Frame 5 (middle frame)
        }

        // Cycle through frames 1-9 at 12 fps
        const frameIndex = Math.floor(animTimer * SPRITE_ANIMATION_FPS) % SPRITE_FRAME_COUNT + 1;
        return frameIndex;
    }

    _drawPlayerProcedural(ctx, player) {
        // Procedural fallback - original drawing code
        const { x, y, direction, animTimer, moving } = player;

        const size = TILE_SIZE * 0.7;
        const half = size / 2;
        const headRadius = size * 0.25;
        const bodyHeight = size * 0.5;
        const bodyWidth = size * 0.4;

        ctx.save();
        ctx.translate(x, y);

        // Animação de caminhada
        const walkOffset = moving ? Math.sin(animTimer * 12) * 2 : 0;
        const armSwing = moving ? Math.sin(animTimer * 12) * 8 : 0;
        const legOffset = moving ? Math.sin(animTimer * 12) * 4 : 0;

        // CORPO (torso) - Camisa azul
        ctx.fillStyle = '#2a5a8a';
        this._roundRect(ctx, -bodyWidth/2, -bodyHeight/2 + headRadius, bodyWidth, bodyHeight, 4);

        // CABEÇA - Pele
        ctx.fillStyle = '#fdbcb4';
        ctx.beginPath();
        ctx.arc(0, -half + headRadius, headRadius, 0, Math.PI * 2);
        ctx.fill();

        // Cabelo
        ctx.fillStyle = '#4a2a1a';
        ctx.beginPath();
        ctx.arc(0, -half + headRadius - 2, headRadius - 2, 0, Math.PI * 2);
        ctx.fill();

        // Olhos (direcionais)
        const eyeSize = 3;
        let eyeDx = 0, eyeDy = 0;
        switch (direction) {
            case 'left': eyeDx = -1; break;
            case 'right': eyeDx = 1; break;
            case 'up': eyeDy = -1; break;
            case 'down': eyeDy = 1; break;
        }

        // Branco dos olhos
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-4 + eyeDx, -half + headRadius - 2 + eyeDy, eyeSize, 0, Math.PI * 2);
        ctx.arc(4 + eyeDx, -half + headRadius - 2 + eyeDy, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        // Pupilas
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(-4 + eyeDx * 1.5, -half + headRadius - 2 + eyeDy, eyeSize - 1, 0, Math.PI * 2);
        ctx.arc(4 + eyeDx * 1.5, -half + headRadius - 2 + eyeDy, eyeSize - 1, 0, Math.PI * 2);
        ctx.fill();

        // BRAÇOS (animados) - Pele
        ctx.fillStyle = '#fdbcb4';
        const armY = -bodyHeight/2 + headRadius + 8;
        // Braço esquerdo
        ctx.fillRect(-bodyWidth/2 - 4, armY + armSwing, 4, 12);
        // Braço direito
        ctx.fillRect(bodyWidth/2, armY - armSwing, 4, 12);

        // PERNAS (animadas alternadamente) - Calça azul escura
        ctx.fillStyle = '#1a3a5a';
        const legY = bodyHeight/2 + headRadius;
        // Perna esquerda
        ctx.fillRect(-bodyWidth/2 + 2, legY, 6, 10 + legOffset);
        // Perna direita
        ctx.fillRect(bodyWidth/2 - 8, legY, 6, 10 - legOffset);

        // PÉS - Sapatos pretos
        ctx.fillStyle = '#333';
        ctx.fillRect(-bodyWidth/2 + 1, legY + 10 + legOffset, 8, 3);
        ctx.fillRect(bodyWidth/2 - 9, legY + 10 - legOffset, 8, 3);

        ctx.restore();
    }

    drawEnemy(ctx, enemy) {
        if (!enemy.alive) return;

        // Draw rage effects first (behind zombie)
        if (enemy.isRaging && enemy.rageVisualIntensity > 0) {
            this._drawRageEffects(ctx, enemy);
        }

        // Try sprite rendering first, fallback to procedural
        if (this.zombieLoader.isReady()) {
            this._drawZombieSprite(ctx, enemy);
        } else {
            this._drawZombieProcedural(ctx, enemy);
        }

        // Draw rage tint overlay (on top of zombie)
        if (enemy.isRaging && enemy.rageVisualIntensity > 0) {
            this._drawRageTint(ctx, enemy);
        }

        // HP Bar (only show when damaged)
        if (enemy.hp < enemy.maxHp) {
            this._drawEnemyHPBar(ctx, enemy, enemy.x, enemy.y);
        }
    }

    _drawZombieSprite(ctx, enemy) {
        const { x, y, direction, animTimer, moving } = enemy;

        // Calculate frame index (1-9)
        const frameIndex = this._calculateZombieFrame(animTimer, moving);
        const sprite = this.zombieLoader.getSprite(direction, frameIndex);

        if (!sprite) {
            console.warn(`Zombie sprite not found: zombie_${direction}_${frameIndex}`);
            this._drawZombieProcedural(ctx, enemy);
            return;
        }

        // Scale 64x64 sprite to fit TILE_SIZE (48px)
        const scale = TILE_SIZE / ZOMBIE_SPRITE_SIZE;  // 48 / 64 = 0.75
        const drawWidth = ZOMBIE_SPRITE_SIZE * scale;
        const drawHeight = ZOMBIE_SPRITE_SIZE * scale;

        // Center on enemy position
        const drawX = x - drawWidth / 2;
        const drawY = y - drawHeight / 2;

        ctx.drawImage(sprite, drawX, drawY, drawWidth, drawHeight);
    }

    _calculateZombieFrame(animTimer, moving) {
        if (!moving) {
            return ZOMBIE_IDLE_FRAME;  // Frame 5 (middle frame)
        }

        // Cycle through frames 1-9 at 8 fps (slower than player)
        const frameIndex = Math.floor(animTimer * ZOMBIE_ANIMATION_FPS) % ZOMBIE_FRAME_COUNT + 1;
        return frameIndex;
    }

    _drawZombieProcedural(ctx, enemy) {
        // Procedural fallback - original drawing code
        const { x, y, enemyType, animTimer, moving, hitFlash } = enemy;
        const size = TILE_SIZE * 0.7;
        const half = size / 2;

        // Cores base por tipo de zumbi
        let skinColor, clothesColor, eyeColor;
        switch (enemyType) {
            case 'chaser':
                skinColor = '#8b6a4a'; // Marrom avermelhado
                clothesColor = '#5a2a1a'; // Vermelho escuro
                eyeColor = '#ff4444'; // Vermelho brilhante
                break;
            case 'smart':
                skinColor = '#5a4a6a'; // Roxo acinzentado
                clothesColor = '#3a2a4a'; // Roxo escuro
                eyeColor = '#aa44ff'; // Roxo brilhante
                break;
            default: // wanderer
                skinColor = '#6a8a5a'; // Verde acinzentado
                clothesColor = '#4a5a3a'; // Verde escuro
                eyeColor = '#ffff44'; // Amarelo brilhante
        }

        // Flash branco quando atingido
        if (hitFlash) {
            skinColor = '#ffffff';
            clothesColor = '#ffffff';
        }

        ctx.save();
        ctx.translate(x, y);

        // Animação de movimento zumbi (mais lenta e arrastada)
        const zombieBob = moving ? Math.sin(animTimer * 4) * 1.5 : 0; // Mais lento
        const armSway = moving ? Math.sin(animTimer * 4 + Math.PI) * 6 : 0;
        const legDrag = moving ? Math.sin(animTimer * 4) * 3 : 0;

        // CORPO (torso desgastado)
        ctx.fillStyle = clothesColor;
        const bodyWidth = size * 0.45;
        const bodyHeight = size * 0.5;
        this._roundRect(ctx, -bodyWidth/2, -bodyHeight/2 + size * 0.25, bodyWidth, bodyHeight, 3);

        // Detalhes de roupas rasgadas (linhas irregulares)
        if (!hitFlash) {
            ctx.strokeStyle = '#2a1a0a';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-bodyWidth/2 + 2, -bodyHeight/2 + size * 0.25 + 5);
            ctx.lineTo(bodyWidth/2 - 2, -bodyHeight/2 + size * 0.25 + 8);
            ctx.moveTo(-bodyWidth/2 + 3, -bodyHeight/2 + size * 0.25 + 15);
            ctx.lineTo(bodyWidth/2 - 3, -bodyHeight/2 + size * 0.25 + 18);
            ctx.stroke();
        }

        // CABEÇA (oval alongado, pele zumbi)
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.ellipse(0, -half + size * 0.25, size * 0.22, size * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();

        // Feridas/rachaduras na cabeça
        if (!hitFlash) {
            ctx.strokeStyle = '#4a2a1a';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-size * 0.15, -half + size * 0.2);
            ctx.lineTo(-size * 0.08, -half + size * 0.15);
            ctx.moveTo(size * 0.1, -half + size * 0.25);
            ctx.lineTo(size * 0.18, -half + size * 0.2);
            ctx.stroke();
        }

        // OLHOS (vermelhos/amarelados, brilhantes)
        if (!hitFlash) {
            ctx.fillStyle = eyeColor;
            ctx.beginPath();
            ctx.arc(-5, -half + size * 0.2, 3, 0, Math.PI * 2);
            ctx.arc(5, -half + size * 0.2, 3, 0, Math.PI * 2);
            ctx.fill();

            // Brilho nos olhos
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(-4, -half + size * 0.19, 1, 0, Math.PI * 2);
            ctx.arc(6, -half + size * 0.19, 1, 0, Math.PI * 2);
            ctx.fill();
        }

        // BRAÇOS (estendidos para frente, postura zumbi)
        ctx.fillStyle = skinColor;
        const armLength = 14;
        const armWidth = 5;
        const armBaseY = -bodyHeight/2 + size * 0.25 + 8;

        // Braço esquerdo (estendido)
        ctx.save();
        ctx.translate(-bodyWidth/2 - 2, armBaseY);
        ctx.rotate(-0.3 + armSway * 0.1); // Estendido para frente
        ctx.fillRect(0, 0, armWidth, armLength);
        ctx.restore();

        // Braço direito (estendido)
        ctx.save();
        ctx.translate(bodyWidth/2 + 2, armBaseY);
        ctx.rotate(0.3 - armSway * 0.1); // Estendido para frente
        ctx.fillRect(0, 0, armWidth, armLength);
        ctx.restore();

        // PERNAS (arrastadas, movimento lento)
        ctx.fillStyle = clothesColor;
        const legY = bodyHeight/2 + size * 0.25;
        const legWidth = 6;
        const legHeight = 12;

        // Perna esquerda (arrastada)
        ctx.fillRect(-bodyWidth/2 + 3, legY + zombieBob, legWidth, legHeight + legDrag);
        // Perna direita (arrastada)
        ctx.fillRect(bodyWidth/2 - 9, legY + zombieBob, legWidth, legHeight - legDrag);

        // PÉS (descalços ou sapatos rasgados)
        if (!hitFlash) {
            ctx.fillStyle = '#3a2a1a';
            ctx.fillRect(-bodyWidth/2 + 2, legY + legHeight + legDrag + zombieBob, 8, 3);
            ctx.fillRect(bodyWidth/2 - 10, legY + legHeight - legDrag + zombieBob, 8, 3);
        }

        ctx.restore();
    }

    drawBomb(ctx, bomb) {
        if (!bomb.alive) return;

        const { x, y, pulseTimer } = bomb;
        const pulse = 1 + Math.sin(pulseTimer * 8) * 0.1;
        const radius = TILE_SIZE * 0.3 * pulse;

        ctx.save();
        ctx.translate(x, y);

        // Bomb body
        ctx.fillStyle = COLOR_BOMB;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.arc(-radius * 0.3, -radius * 0.3, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Fuse
        ctx.strokeStyle = '#a85';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -radius);
        ctx.quadraticCurveTo(radius * 0.5, -radius * 1.5, radius * 0.8, -radius * 1.8);
        ctx.stroke();

        // Spark at tip
        const sparkSize = 3 + Math.sin(pulseTimer * 15) * 2;
        ctx.fillStyle = bomb.timer < 0.5 ? '#f44' : '#fa0';
        ctx.beginPath();
        ctx.arc(radius * 0.8, -radius * 1.8, sparkSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawExplosion(ctx, explosion) {
        if (!explosion.alive) return;

        const progress = explosion.progress;
        const alpha = 1 - progress;

        for (const cell of explosion.cells) {
            const cx = cell.col * TILE_SIZE + TILE_SIZE / 2;
            const cy = cell.row * TILE_SIZE + TILE_SIZE / 2 + HUD_HEIGHT;
            const radius = TILE_SIZE * 0.45;

            // Fogo central (laranja/vermelho)
            const fireGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
            fireGradient.addColorStop(0, `rgba(255, 102, 0, ${alpha})`);
            fireGradient.addColorStop(0.5, `rgba(255, 51, 0, ${alpha * 0.9})`);
            fireGradient.addColorStop(1, `rgba(204, 0, 0, ${alpha * 0.5})`);

            ctx.fillStyle = fireGradient;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(cx, cy, radius * (1 - progress * 0.5), 0, Math.PI * 2);
            ctx.fill();

            // Fumaça escura ao redor
            const smokeGradient = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius * 1.5);
            smokeGradient.addColorStop(0, `rgba(50, 50, 50, ${alpha * 0.6})`);
            smokeGradient.addColorStop(1, `rgba(0, 0, 0, 0)`);

            ctx.fillStyle = smokeGradient;
            ctx.beginPath();
            ctx.arc(cx, cy, radius * 1.5 * (1 - progress), 0, Math.PI * 2);
            ctx.fill();

            // Partículas de detritos voando
            this._drawDebrisParticles(ctx, cx, cy, radius, progress);

            ctx.globalAlpha = 1.0;
        }
    }

    _drawDebrisParticles(ctx, x, y, radius, progress) {
        // Pequenos pedaços de escombros voando
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            const distance = radius * progress * 1.5;
            const px = x + Math.cos(angle) * distance;
            const py = y + Math.sin(angle) * distance;

            ctx.fillStyle = '#4a4a4a';
            ctx.fillRect(px - 2, py - 2, 4, 4);
        }
    }

    drawPowerUp(ctx, powerup) {
        if (!powerup.alive) return;

        const { x, y, powerType, bobTimer } = powerup;
        const bob = Math.sin(bobTimer * 4) * 3;
        const size = TILE_SIZE * 0.6;
        const half = size / 2;

        let color;
        switch (powerType) {
            case POWERUP_BOMB: color = COLOR_POWERUP_BOMB; break;
            case POWERUP_FLAME: color = COLOR_POWERUP_FLAME; break;
            case POWERUP_SPEED: color = COLOR_POWERUP_SPEED; break;
            case POWERUP_HEALTH: color = COLOR_POWERUP_HEALTH; break;
            default: color = '#fff';
        }

        ctx.save();
        ctx.translate(x, y + bob);

        // Background circle
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.beginPath();
        ctx.arc(0, 0, half, 0, Math.PI * 2);
        ctx.fill();

        // Icon
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, half - 4, 0, Math.PI * 2);
        ctx.fill();

        // Icon/Label
        if (powerType === POWERUP_HEALTH) {
            // Desenhar mini coração
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(0, 2);
            ctx.bezierCurveTo(-4, -2, -7, 1, -4, 4);
            ctx.lineTo(0, 7);
            ctx.lineTo(4, 4);
            ctx.bezierCurveTo(7, 1, 4, -2, 0, 2);
            ctx.fill();
        } else {
            // Labels para outros power-ups
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            let label = '';
            switch (powerType) {
                case POWERUP_BOMB: label = 'B'; break;
                case POWERUP_FLAME: label = 'F'; break;
                case POWERUP_SPEED: label = 'S'; break;
            }
            ctx.fillText(label, 0, 1);
        }

        ctx.restore();
    }

    _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();
    }

    _drawEnemyHPBar(ctx, enemy, x, y) {
        const barWidth = TILE_SIZE * 0.6;
        const barHeight = 4;
        const barY = y - TILE_SIZE * 0.5; // Above enemy
        const barX = x - barWidth / 2;

        // Background (red)
        ctx.fillStyle = '#cc0000';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // HP bar (green)
        const hpPercent = enemy.hp / enemy.maxHp;
        ctx.fillStyle = '#00cc00';
        ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);

        // Border
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }

    /**
     * Draw rage visual effects (aura pulsante)
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} enemy - Enemy entity
     */
    _drawRageEffects(ctx, enemy) {
        const { x, y, rageVisualIntensity, ragePhase, animTimer } = enemy;
        
        // Aura pulsante ao redor do zumbi
        const pulse = Math.sin((animTimer || 0) * 5) * 0.5 + 0.5; // 0 a 1
        const baseRadius = 30;
        const pulseRadius = baseRadius + pulse * 10; // Pulsa entre 30-40px
        
        // Intensidade baseada na fase
        let intensity = rageVisualIntensity;
        if (ragePhase === 'paused') {
            intensity = 1.0; // Máximo durante pausa
        }
        
        // Aura externa (mais suave)
        const outerAlpha = 0.3 * intensity * pulse;
        ctx.strokeStyle = `rgba(255, 0, 0, ${outerAlpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Aura interna (mais intensa)
        const innerAlpha = 0.5 * intensity * (1 - pulse * 0.5);
        ctx.strokeStyle = `rgba(255, 100, 100, ${innerAlpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, baseRadius * 0.7, 0, Math.PI * 2);
        ctx.stroke();
    }

    /**
     * Draw rage tint overlay (vermelho sobre o sprite)
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Object} enemy - Enemy entity
     */
    _drawRageTint(ctx, enemy) {
        const { x, y, rageVisualIntensity, ragePhase } = enemy;
        
        // Intensidade baseada na fase
        let intensity = rageVisualIntensity;
        if (ragePhase === 'paused') {
            intensity = 1.0; // Máximo durante pausa
        }
        
        // Tint vermelho usando multiply blend mode
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = intensity * 0.4; // 40% de opacidade máxima
        
        const size = TILE_SIZE * 0.8;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
        
        ctx.restore();
    }
}
