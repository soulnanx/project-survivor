# Project Survivor - Fase 2: Enemy HP System

## Contexto

O jogo está sendo transformado em um RPG/Roguelike. A **Fase 1 (Player HP System)** já foi implementada com sucesso:
- Player tem 20 HP, toma dano de explosões (15) e inimigos (5)
- Sistema de vidas removido (morte permanente ao chegar a 0 HP)
- Método `takeDamage()` implementado com invencibilidade temporária

A **Fase 2** implementa o sistema de HP para os inimigos, onde cada tipo tem durabilidade diferente:
- **Wanderer** (movimento aleatório): 1 HP - morre com 1 explosão
- **Chaser** (persegue player): 2 HP - precisa 2 explosões
- **Smart** (pathfinding BFS): 3 HP - precisa 3 explosões

## Objetivos desta Sessão

1. **Inicializar git** na pasta `bomberman/`
2. **Fazer commit inicial** com o estado atual (Fase 1 completa)
3. **Implementar Fase 2: Enemy HP System**
4. **Commit final** da Fase 2

---

## Implementação da Fase 2

### Arquitetura

Seguir o mesmo padrão implementado na Fase 1:
- Método `takeDamage(amount)` que retorna boolean (true = morreu, false = sobreviveu)
- EventBus para comunicação (`enemy:killed`, `enemy:hit`)
- Visual feedback (HP bar quando danificado, flash branco)
- Audio feedback (sons distintos para hit e morte)

### Arquivos Críticos

**5 arquivos que precisam ser modificados:**

1. **`js/constants.js`** - Adicionar constantes de HP por tipo
2. **`js/entities/Enemy.js`** - Implementar sistema de HP e takeDamage()
3. **`js/systems/CollisionSystem.js`** - Mudar de morte instantânea para dano
4. **`js/rendering/EntityRenderer.js`** - Renderizar HP bar e flash branco
5. **`js/audio/SoundEngine.js`** - Adicionar sons `enemyHit` e `enemyKilled`

---

## Mudanças Detalhadas

### 1. `js/constants.js`

**Adicionar após linha 33:**
```javascript
// Enemy HP System
export const ENEMY_HP_WANDERER = 1;
export const ENEMY_HP_CHASER = 2;
export const ENEMY_HP_SMART = 3;
export const ENEMY_HIT_FLASH_DURATION = 0.15; // seconds
```

### 2. `js/entities/Enemy.js`

**Adicionar imports:**
```javascript
import { ENEMY_HP_WANDERER, ENEMY_HP_CHASER, ENEMY_HP_SMART,
         ENEMY_HIT_FLASH_DURATION } from '../constants.js';
import EventBus from '../core/EventBus.js';
```

**No constructor (após linha 13):**
```javascript
// HP System
this.maxHp = this._getMaxHpForType(enemyType);
this.hp = this.maxHp;

// Hit flash effect
this.hitFlash = false;
this.hitFlashTimer = 0;
```

**Adicionar métodos:**
```javascript
_getMaxHpForType(enemyType) {
    switch (enemyType) {
        case 'chaser': return ENEMY_HP_CHASER;
        case 'smart': return ENEMY_HP_SMART;
        default: return ENEMY_HP_WANDERER;
    }
}

takeDamage(amount, soundEngine, level) {
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

    EventBus.emit('enemy:hit', { enemy: this, damage: amount });
    if (soundEngine) soundEngine.play('enemyHit');
    return false; // still alive
}
```

**Modificar `update()` para gerenciar flash:**
```javascript
update(dt, context) {
    super.update(dt, context);

    // Hit flash timer
    if (this.hitFlash) {
        this.hitFlashTimer -= dt;
        if (this.hitFlashTimer <= 0) {
            this.hitFlash = false;
        }
    }

    if (this.moving) {
        this.animTimer += dt;
    }
}
```

### 3. `js/systems/CollisionSystem.js`

**Substituir linha ~62 (na seção "Enemies vs Explosions"):**

**Era:**
```javascript
enemy.alive = false;
EventBus.emit('enemy:killed', { enemy, level: context.level });
```

**Fica:**
```javascript
enemy.takeDamage(DAMAGE_EXPLOSION, context.soundEngine, context.level);
// Evento enemy:killed já é emitido dentro de takeDamage()
```

### 4. `js/rendering/EntityRenderer.js`

**Modificar `drawEnemy()` para aplicar flash branco:**

**No início do método (após determinar `color`):**
```javascript
// Apply white flash when hit
if (enemy.hitFlash) {
    color = '#ffffff';
}
```

**No desenho dos olhos:**
```javascript
// Eyes (skip if white flash for better effect)
if (!enemy.hitFlash) {
    // ... código existente dos olhos
}
```

**Adicionar ao final do método (antes do `ctx.restore()`):**
```javascript
ctx.restore();

// HP Bar (only show when damaged)
if (enemy.hp < enemy.maxHp) {
    this._drawEnemyHPBar(ctx, enemy, x, y);
}
```

**Adicionar novo método:**
```javascript
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
```

### 5. `js/audio/SoundEngine.js`

**Adicionar cases no método `play()` (linha ~40):**
```javascript
case 'enemyHit': this._enemyHit(ctx); break;
case 'enemyKilled': this._enemyKilled(ctx); break;
```

**Adicionar métodos de som:**
```javascript
_enemyHit(ctx) {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.1);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
}

_enemyKilled(ctx) {
    const now = ctx.currentTime;
    // Two-tone descending sound
    const osc1 = ctx.createOscillator();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(600, now);
    osc1.frequency.exponentialRampToValueAtTime(300, now + 0.15);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(400, now + 0.05);
    osc2.frequency.exponentialRampToValueAtTime(150, now + 0.2);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc1.connect(gain).connect(ctx.destination);
    osc2.connect(gain);
    osc1.start(now);
    osc2.start(now + 0.05);
    osc1.stop(now + 0.15);
    osc2.stop(now + 0.25);
}
```

---

## Status: ✅ IMPLEMENTADO

Esta fase foi completamente implementada e testada.
