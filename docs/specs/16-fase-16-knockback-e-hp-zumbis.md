# Project Survivor - Fase 16: Knockback e HP dos Zumbis

## Contexto

A **Fase 15** implementou o sistema de ataque físico básico. A **Fase 16** melhora o combate corpo-a-corpo adicionando:
1. **Sistema de Knockback**: Zumbis são empurrados para trás ao receber dano físico
2. **Aumento de HP**: Todos os zumbis agora têm 10 HP (ao invés de 1-3 HP)

Essas mudanças tornam o combate mais tático e dão mais tempo para o player reagir, já que os zumbis não morrem instantaneamente.

## Objetivos desta Fase

1. **Aumentar HP dos zumbis** para 10 HP (todos os tipos)
2. **Implementar sistema de knockback** quando zumbis recebem dano físico
3. **Adicionar estado de stun temporário** durante o knockback
4. **Ajustar balanceamento** do combate físico

---

## Implementação da Fase 16

### Arquitetura

O sistema seguirá o padrão existente:
- Modificar constantes de HP em `constants.js`
- Adicionar propriedades de knockback no `Enemy.js`
- Implementar lógica de empurrão no `takeDamage()` quando for dano físico
- Atualizar movimento do inimigo para respeitar o knockback
- Modificar `PlayerControlBehavior.js` para passar informação de que é dano físico

### Arquivos Críticos

**4 arquivos que precisam ser modificados:**

1. **`js/constants.js`** - Aumentar HP dos zumbis e adicionar constantes de knockback
2. **`js/entities/Enemy.js`** - Implementar sistema de knockback
3. **`js/behaviors/PlayerControlBehavior.js`** - Passar flag de dano físico
4. **`js/entities/Enemy.js`** - Atualizar movimento para respeitar knockback

---

## Mudanças Detalhadas

### 1. `js/constants.js`

**Modificar constantes de HP (linhas 37-39):**
```javascript
// Enemy HP System - Todos os zumbis têm 10 HP
export const ENEMY_HP_WANDERER = 10;
export const ENEMY_HP_CHASER = 10;
export const ENEMY_HP_SMART = 10;
export const ENEMY_HIT_FLASH_DURATION = 0.15; // seconds
```

**Adicionar após linha 40:**
```javascript
// Knockback System
export const KNOCKBACK_FORCE = 120; // pixels por segundo de velocidade inicial
export const KNOCKBACK_DURATION = 0.3; // segundos de knockback
export const KNOCKBACK_FRICTION = 300; // desaceleração (pixels/s²)
```

### 2. `js/entities/Enemy.js`

**Adicionar imports:**
```javascript
import { LEVEL_CONFIG, ENEMY_HP_WANDERER, ENEMY_HP_CHASER, ENEMY_HP_SMART, 
         ENEMY_HIT_FLASH_DURATION, KNOCKBACK_FORCE, KNOCKBACK_DURATION, 
         KNOCKBACK_FRICTION } from '../constants.js';
```

**No constructor (após linha 22):**
```javascript
// Knockback System
this.knockbackX = 0; // Velocidade horizontal de knockback
this.knockbackY = 0; // Velocidade vertical de knockback
this.knockbackTimer = 0; // Timer do knockback
this.isKnockedBack = false; // Flag para indicar se está em knockback
```

**Modificar método `takeDamage()` para aceitar direção de knockback:**
```javascript
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
```

**Modificar método `update()` para processar knockback:**
```javascript
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
```

**Adicionar método público para definir direção do knockback:**
```javascript
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
```

### 3. `js/behaviors/PlayerControlBehavior.js`

**Modificar método `_performPhysicalAttack()` para aplicar knockback:**

**Substituir a parte onde aplica dano (após linha ~140):**
```javascript
// Calcular direção do knockback (do player para o inimigo - empurra para longe)
const knockbackDx = enemy.x - entity.x;
const knockbackDy = enemy.y - entity.y;

// Aplicar dano com knockback
const died = enemy.takeDamage(damage, soundEngine, context.level, 
    { x: knockbackDx, y: knockbackDy }); // Passar direção do knockback

hitEnemy = true;
```

### 4. `js/systems/CollisionSystem.js`

**Verificar se precisa atualizar chamadas de `takeDamage()`:**

O `CollisionSystem.js` chama `enemy.takeDamage()` para explosões. Essas chamadas devem continuar sem o flag `isPhysicalAttack` (ou seja, `false` por padrão), então não precisam ser modificadas.

---

## Detalhes de Implementação

### Sistema de Knockback

O knockback funciona da seguinte forma:
1. **Direção**: Calculada do player em direção ao inimigo (empurra para longe)
2. **Força**: `KNOCKBACK_FORCE` pixels por segundo de velocidade inicial
3. **Duração**: `KNOCKBACK_DURATION` segundos ou até velocidade cair abaixo de 5 px/s
4. **Fricção**: `KNOCKBACK_FRICTION` desacelera o movimento gradualmente
5. **Stun**: Durante o knockback, o inimigo não pode se mover normalmente

### Aumento de HP

Todos os tipos de zumbis agora têm **10 HP**:
- **Wanderer**: 10 HP (antes: 1 HP)
- **Chaser**: 10 HP (antes: 2 HP)
- **Smart**: 10 HP (antes: 3 HP)

Isso significa que:
- Ataques físicos (1 HP) precisam de 10 hits para matar
- Explosões (15 HP) ainda matam em 1 hit
- Combate corpo-a-corpo se torna mais estratégico

### Balanceamento

Com 10 HP, o combate físico se torna:
- Mais tático (precisa de múltiplos hits)
- Mais seguro (knockback dá espaço)
- Mais desafiador (zumbis não morrem instantaneamente)

O knockback permite:
- Criar distância entre ataques
- Evitar dano de toque enquanto ataca
- Controlar posicionamento dos inimigos

---

## Status: ⬜ PENDENTE

Esta fase está pronta para implementação.
