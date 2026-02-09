# Project Survivor - Sistema de HP, XP e Progressão

## Contexto
O jogo atual funciona com sistema de vidas (3 vidas, morte instantânea). O objetivo é transformá-lo em um **jogo estilo RPG/Roguelike** com:
- Sistema de **HP (pontos de vida)** ao invés de morte instantânea
- **Dano variável**: Explosões causam 15 HP, inimigos causam 5 HP
- **Morte permanente**: Sem sistema de vidas, quando HP = 0, game over
- **Inimigos com HP**: Precisam de múltiplos ataques para morrer
- **Sistema de XP/Level**: Jogador ganha experiência matando inimigos e evolui
- **Power-ups de cura**: Restauram HP durante o jogo
- **Arquitetura extensível**: Preparada para persistência e sistema de dungeons no futuro

O sistema de invencibilidade com piscamento já existe e será reutilizado para feedback de dano.

---

## Arquitetura - Novos Componentes

### 1. Sistema de HP (Player e Enemies)
**Arquivos afetados:**
- `js/entities/Player.js` - adicionar propriedades de HP
- `js/entities/Enemy.js` - adicionar HP por tipo
- `js/systems/CollisionSystem.js` - mudar de morte instantânea para redução de HP
- `js/constants.js` - novas constantes de HP e dano

### 2. Sistema de Experiência/Level
**Novo arquivo:**
- `js/systems/ExperienceSystem.js` - gerencia XP, levels, stats

**Arquivos afetados:**
- `js/entities/Player.js` - propriedades de XP/level
- `js/core/Game.js` - integrar ExperienceSystem

### 3. Power-up de Cura
**Arquivos afetados:**
- `js/constants.js` - novo tipo `POWERUP_HEALTH`
- `js/systems/CollisionSystem.js` - lógica de coletar heal
- `js/rendering/EntityRenderer.js` - visual do power-up de vida

### 4. UI de RPG
**Arquivos afetados:**
- `js/rendering/UIRenderer.js` - barra de HP, XP bar, level display
- `js/rendering/EntityRenderer.js` - mostrar HP dos inimigos

### 5. Remoção do Sistema de Vidas
**Arquivos afetados:**
- `js/core/Game.js` - remover lógica de vidas e respawn
- `js/constants.js` - remover `PLAYER_LIVES`

---

## Implementação Detalhada

### Fase 1: Sistema de HP do Player (20 HP)

#### 1.1 Constantes (`js/constants.js`)
```javascript
// Player HP
export const PLAYER_MAX_HP = 20;
export const PLAYER_START_HP = 20;

// Damage values
export const DAMAGE_EXPLOSION = 15;
export const DAMAGE_ENEMY_TOUCH = 5;

// Invincibility after damage
export const INVINCIBILITY_TIME_DAMAGE = 1.0; // 1 segundo piscando
export const INVINCIBILITY_TIME_RESPAWN = 2.0; // (manter para referência, não mais usado)

// Remover:
// export const PLAYER_LIVES = 3;  // ← DELETAR
```

#### 1.2 Player Properties (`js/entities/Player.js`)
**Adicionar após linha 13:**
```javascript
this.maxHp = PLAYER_MAX_HP;
this.hp = PLAYER_START_HP;
```

**Manter propriedades de invencibilidade (linhas 20-21):**
```javascript
this.invincible = false;
this.invincibleTimer = 0;
```

**Adicionar método para tomar dano:**
```javascript
takeDamage(amount, soundEngine) {
    if (this.invincible || !this.alive) return false;

    this.hp = Math.max(0, this.hp - amount);

    if (this.hp <= 0) {
        this.alive = false;
        return true; // morreu
    }

    // Ativar invencibilidade temporária
    this.invincible = true;
    this.invincibleTimer = INVINCIBILITY_TIME_DAMAGE;

    if (soundEngine) soundEngine.play('playerHit'); // novo som
    return false; // ainda vivo
}
```

#### 1.3 CollisionSystem - Dano ao invés de morte instantânea (`js/systems/CollisionSystem.js`)

**Player vs Enemies (substituir linhas 13-25):**
```javascript
if (!player.invincible && player.alive) {
    const enemies = entityManager.getLayer('enemies');
    for (const enemy of enemies) {
        if (!enemy.alive) continue;
        const d = dist(player.x, player.y, enemy.x, enemy.y);
        if (d < TILE_SIZE * 0.7) {
            const died = player.takeDamage(DAMAGE_ENEMY_TOUCH, context.soundEngine);
            if (died) {
                EventBus.emit('player:died', { player });
            } else {
                EventBus.emit('player:hit', { player, damage: DAMAGE_ENEMY_TOUCH });
            }
            break;
        }
    }
}
```

**Player vs Explosions (substituir linhas 27-41):**
```javascript
if (!player.invincible && player.alive) {
    const explosions = entityManager.getLayer('explosions');
    for (const explosion of explosions) {
        if (!explosion.alive) continue;
        for (const cell of explosion.cells) {
            if (cell.col === playerCol && cell.row === playerRow) {
                const died = player.takeDamage(DAMAGE_EXPLOSION, context.soundEngine);
                if (died) {
                    EventBus.emit('player:died', { player });
                } else {
                    EventBus.emit('player:hit', { player, damage: DAMAGE_EXPLOSION });
                }
                break;
            }
        }
        if (!player.alive) break;
    }
}
```

**Importante:** Agora emitimos dois eventos:
- `'player:died'` - quando HP chega a 0
- `'player:hit'` - quando toma dano mas sobrevive (para feedback visual/sonoro)

#### 1.4 Game.js - Remover Sistema de Vidas

**Remover da linha 40:**
```javascript
// this.lives = PLAYER_LIVES;  // ← DELETAR
```

**Remover das linhas 165-166:**
```javascript
// this.lives = PLAYER_LIVES;  // ← DELETAR
```

**Simplificar _onPlayerDied (linhas 198-218):**
```javascript
_onPlayerDied() {
    this.soundEngine.play('death');
    this.renderer.particleSystem.emitDeath(this.player.x, this.player.y);

    // Morte permanente - direto para game over
    this.scoreSystem.saveHighScore();
    this.state = STATE_GAME_OVER;

    // Remover todo o código de respawn e vidas
}
```

**Adicionar handler para player:hit:**
```javascript
_setupEvents() {
    EventBus.on('player:died', () => this._onPlayerDied());
    EventBus.on('level:complete', () => this._onLevelComplete());
    EventBus.on('brick:destroyed', () => {
        this.renderer.backgroundLayer.rebuild(this.grid);
        this.soundEngine.play('brickBreak');
    });
    EventBus.on('powerup:collected', () => {
        this.soundEngine.play('powerup');
    });
    EventBus.on('player:hit', ({ damage }) => {  // ← NOVO
        // Feedback adicional (shake screen? particle burst?)
        this.renderer.particleSystem.emitDamage(this.player.x, this.player.y, damage);
    });
}
```

---

## Status: ✅ IMPLEMENTADO

Esta fase foi completamente implementada e testada.
