import Behavior from './Behavior.js';
import { TILE_SIZE, HUD_HEIGHT, DAMAGE_PHYSICAL_ATTACK, PHYSICAL_ATTACK_RANGE, PHYSICAL_ATTACK_COOLDOWN } from '../constants.js';
import { pixelToGridCol, pixelToGridRow, gridToPixelX, gridToPixelY, dist } from '../utils.js';
import Bomb from '../entities/Bomb.js';
import EventBus from '../core/EventBus.js';

export default class PlayerControlBehavior extends Behavior {
    update(entity, dt, context) {
        const { input, grid, entityManager } = context;

        let dx = 0, dy = 0;
        if (input.left) dx = -1;
        else if (input.right) dx = 1;
        if (input.up) dy = -1;
        else if (input.down) dy = 1;

        // Only allow one axis at a time (classic survival movement)
        if (dx !== 0 && dy !== 0) {
            dy = 0;
        }

        entity.moving = dx !== 0 || dy !== 0;

        if (dx !== 0 || dy !== 0) {
            if (dx < 0) entity.direction = 'left';
            else if (dx > 0) entity.direction = 'right';
            else if (dy < 0) entity.direction = 'up';
            else if (dy > 0) entity.direction = 'down';

            const speed = entity.speed * dt;
            let newX = entity.x + dx * speed;
            let newY = entity.y + dy * speed;

            const result = this._moveWithCollision(entity, entity.x, entity.y, newX, newY, dx, dy, grid, entityManager);
            entity.x = result.x;
            entity.y = result.y;
        }

        // Physical attack
        if (input.attack && entity.attackCooldown <= 0) {
            this._performPhysicalAttack(entity, context);
        }

        // Place bomb (Fase 16 - Sistema de Inventário)
        // O jogador pode colocar quantas bombas quiser simultaneamente, limitado apenas pelo inventário
        if ((input.bomb || input.bombKey)) {
            // Verificar se tem bombas disponíveis no inventário
            if (entity.bombInventory <= 0) {
                // Feedback: sem bombas disponíveis
                EventBus.emit('inventory:empty', { item: 'bomb' });
                return;
            }
            
            // Verificar se já existe bomba na mesma posição (evitar sobreposição)
            const col = pixelToGridCol(entity.x);
            const row = pixelToGridRow(entity.y);
            const existing = entityManager.getByType('bomb').find(b => {
                return pixelToGridCol(b.x) === col && pixelToGridRow(b.y) === row;
            });
            if (!existing) {
                const bomb = new Bomb(
                    gridToPixelX(col),
                    gridToPixelY(row),
                    entity.bombRange,
                    entity
                );
                entityManager.add(bomb, 'bombs');
                entity.activeBombs++; // Rastreamento para compatibilidade (não limita quantidade)
                entity.bombInventory--; // Decrementar inventário ao usar bomba
                EventBus.emit('bomb:placed', { bomb });
                context.soundEngine.play('placeBomb');
            }
        }
    }

    _moveWithCollision(entity, ox, oy, nx, ny, dx, dy, grid, entityManager) {
        const halfTile = TILE_SIZE / 2;
        const margin = 3;
        const entityHalf = halfTile - margin;

        const bombBlocking = (col, row) => {
            // Player can walk through bombs they are standing on top of
            const playerCol = pixelToGridCol(ox);
            const playerRow = pixelToGridRow(oy);
            if (col === playerCol && row === playerRow) return false;

            const bombs = entityManager.getByType('bomb');
            for (const bomb of bombs) {
                const bc = pixelToGridCol(bomb.x);
                const br = pixelToGridRow(bomb.y);
                if (bc === col && br === row) return true;
            }
            return false;
        };

        if (dx !== 0) {
            const edgeX = nx + dx * entityHalf;
            const col = pixelToGridCol(edgeX);
            const currentRow = pixelToGridRow(oy);

            if (grid.isSolid(col, currentRow) || bombBlocking(col, currentRow)) {
                if (dx > 0) {
                    nx = col * TILE_SIZE - entityHalf;
                } else {
                    nx = (col + 1) * TILE_SIZE + entityHalf;
                }
            }

            // Corner sliding
            const centerY = gridToPixelY(currentRow);
            const diff = centerY - oy;
            if (Math.abs(diff) > 2) {
                ny = oy + Math.sign(diff) * Math.min(Math.abs(diff), entity.speed * 0.016);
            } else {
                ny = oy;
            }
        } else if (dy !== 0) {
            const edgeY = ny + dy * entityHalf;
            const row = pixelToGridRow(edgeY);
            const currentCol = pixelToGridCol(ox);

            if (grid.isSolid(currentCol, row) || bombBlocking(currentCol, row)) {
                if (dy > 0) {
                    ny = row * TILE_SIZE + HUD_HEIGHT - entityHalf;
                } else {
                    ny = (row + 1) * TILE_SIZE + HUD_HEIGHT + entityHalf;
                }
            }

            // Corner sliding
            const centerX = gridToPixelX(currentCol);
            const diff = centerX - ox;
            if (Math.abs(diff) > 2) {
                nx = ox + Math.sign(diff) * Math.min(Math.abs(diff), entity.speed * 0.016);
            } else {
                nx = ox;
            }
        }

        return { x: nx, y: ny };
    }

    _performPhysicalAttack(entity, context) {
        const { entityManager, soundEngine, player } = context;
        
        // Reset cooldown
        entity.attackCooldown = PHYSICAL_ATTACK_COOLDOWN;
        
        // Determinar posição de ataque baseada na direção
        let attackX = entity.x;
        let attackY = entity.y;
        const attackRange = PHYSICAL_ATTACK_RANGE;
        
        switch (entity.direction) {
            case 'up':
                attackY -= attackRange;
                break;
            case 'down':
                attackY += attackRange;
                break;
            case 'left':
                attackX -= attackRange;
                break;
            case 'right':
                attackX += attackRange;
                break;
        }
        
        // Verificar inimigos próximos na área de ataque
        const enemies = entityManager.getLayer('enemies');
        let hitEnemy = false;
        
        for (const enemy of enemies) {
            if (!enemy.alive) continue;
            
            // Calcular distância do centro do ataque até o inimigo
            const distance = dist(attackX, attackY, enemy.x, enemy.y);
            
            if (distance < TILE_SIZE * 0.7) { // Mesma área de colisão que touch damage
                // Calcular dano base
                let damage = DAMAGE_PHYSICAL_ATTACK;
                
                // Aplicar attackPower do player
                damage = Math.floor(damage * player.attackPower);
                
                // Verificar crítico
                const isCrit = Math.random() * 100 < player.critChance;
                if (isCrit) {
                    damage = Math.floor(damage * 2);
                    EventBus.emit('player:crit', { enemy, damage });
                }
                
                // Calcular direção do knockback (do player para o inimigo - empurra para longe)
                const knockbackDx = enemy.x - entity.x;
                const knockbackDy = enemy.y - entity.y;
                
                // Aplicar dano com knockback
                const died = enemy.takeDamage(damage, soundEngine, context.level, 
                    { x: knockbackDx, y: knockbackDy }); // Passar direção do knockback
                
                hitEnemy = true;
                
                // Apenas um inimigo por ataque (pode ser expandido depois)
                break;
            }
        }
        
        // Tocar som de ataque
        if (hitEnemy) {
            soundEngine.play('physicalAttackHit');
        } else {
            soundEngine.play('physicalAttackMiss');
        }
        
        // Emitir evento para feedback visual
        EventBus.emit('player:physicalAttack', { 
            x: attackX, 
            y: attackY, 
            direction: entity.direction,
            hit: hitEnemy 
        });
    }
}
