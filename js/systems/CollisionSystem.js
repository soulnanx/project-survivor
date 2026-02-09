import { TILE_SIZE, POWERUP_BOMB, POWERUP_FLAME, POWERUP_SPEED, POWERUP_HEALTH, DAMAGE_EXPLOSION, DAMAGE_ENEMY_TOUCH, HEALTH_POWERUP_HEAL } from '../constants.js';
import { pixelToGridCol, pixelToGridRow, dist } from '../utils.js';
import EventBus from '../core/EventBus.js';

export default class CollisionSystem {
    update(context) {
        const { entityManager, player, grid } = context;
        if (!player || !player.alive) return;

        const playerCol = pixelToGridCol(player.x);
        const playerRow = pixelToGridRow(player.y);

        // Player vs Enemies
        if (!player.invincible && player.alive) {
            const enemies = entityManager.getLayer('enemies');
            for (const enemy of enemies) {
                if (!enemy.alive) continue;
                const d = dist(player.x, player.y, enemy.x, enemy.y);
                if (d < TILE_SIZE * 0.7) {
                    const result = player.takeDamage(DAMAGE_ENEMY_TOUCH, context.soundEngine);
                    if (result.died) {
                        EventBus.emit('player:died', { player });
                    } else {
                        EventBus.emit('player:hit', { player, damage: result.damage });
                    }
                    break;
                }
            }
        }

        // Player vs Explosions
        if (!player.invincible && player.alive) {
            const explosions = entityManager.getLayer('explosions');
            for (const explosion of explosions) {
                if (!explosion.alive) continue;
                for (const cell of explosion.cells) {
                    if (cell.col === playerCol && cell.row === playerRow) {
                        const result = player.takeDamage(DAMAGE_EXPLOSION, context.soundEngine);
                        if (result.died) {
                            EventBus.emit('player:died', { player });
                        } else {
                            EventBus.emit('player:hit', { player, damage: result.damage });
                        }
                        break;
                    }
                }
                if (!player.alive) break;
            }
        }

        // Enemies vs Explosions
        const explosions = entityManager.getLayer('explosions');
        const enemies = entityManager.getLayer('enemies');
        for (const enemy of enemies) {
            if (!enemy.alive) continue;
            const ec = pixelToGridCol(enemy.x);
            const er = pixelToGridRow(enemy.y);
            for (const explosion of explosions) {
                if (!explosion.alive) continue;
                for (const cell of explosion.cells) {
                    if (cell.col === ec && cell.row === er) {
                        // Calcular dano base
                        let damage = DAMAGE_EXPLOSION;

                        // Aplicar attackPower do player
                        damage = Math.floor(damage * player.attackPower);

                        // Verificar crítico
                        const isCrit = Math.random() * 100 < player.critChance;
                        if (isCrit) {
                            damage = Math.floor(damage * 2);
                            EventBus.emit('player:crit', { enemy, damage });
                        }

                        enemy.takeDamage(damage, context.soundEngine, context.level);
                        // Evento enemy:killed já é emitido dentro de takeDamage()
                        break;
                    }
                }
                if (!enemy.alive) break;
            }
        }

        // REMOVIDO NA FASE 11: Power-ups serão substituídos por drops na Fase 13
        // Player vs PowerUps
        // const powerups = entityManager.getLayer('powerups');
        // for (const powerup of powerups) {
        //     if (!powerup.alive) continue;
        //     const pc = pixelToGridCol(powerup.x);
        //     const pr = pixelToGridRow(powerup.y);
        //     if (pc === playerCol && pr === playerRow) {
        //         this._collectPowerUp(player, powerup);
        //         EventBus.emit('powerup:collected', { type: powerup.powerType, player });
        //     }
        // }
    }

    _collectPowerUp(player, powerup) {
        switch (powerup.powerType) {
            case POWERUP_BOMB:
                player.maxBombs++;
                break;
            case POWERUP_FLAME:
                player.bombRange++;
                break;
            case POWERUP_SPEED:
                player.speed += 30;
                break;
            case POWERUP_HEALTH:
                player.hp = Math.min(player.maxHp, player.hp + HEALTH_POWERUP_HEAL);
                break;
        }
        powerup.alive = false;
    }
}
