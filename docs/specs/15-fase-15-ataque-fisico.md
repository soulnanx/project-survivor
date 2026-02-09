# Project Survivor - Fase 15: Sistema de Ataque Físico

## Contexto

O jogo Project Survivor já possui um sistema completo de combate baseado em bombas e explosões. A **Fase 15** adiciona um novo método de combate: **ataque físico direto** (como um soco), permitindo que o player cause dano aos inimigos sem depender exclusivamente de bombas.

Este sistema oferece uma alternativa de combate corpo-a-corpo, útil para situações onde o player está sem bombas ou precisa de uma opção mais rápida e direta.

## Objetivos desta Fase

1. **Adicionar botão de ação** para ataque físico (tecla `F` - Fight)
2. **Implementar sistema de detecção** de inimigos próximos na direção do player
3. **Aplicar dano físico** de 1 HP aos inimigos atingidos
4. **Adicionar feedback visual e sonoro** para o ataque
5. **Implementar cooldown** para evitar spam de ataques

---

## Implementação da Fase 15

### Arquitetura

O sistema seguirá o padrão existente:
- Nova entrada no `Input.js` para detectar a tecla de ataque
- Lógica de ataque no `PlayerControlBehavior.js`
- Detecção de colisão com inimigos usando o sistema existente
- Aplicação de dano usando `enemy.takeDamage()` já implementado
- Feedback visual (partículas, animação) e sonoro

### Arquivos Críticos

**5 arquivos que precisam ser modificados:**

1. **`js/constants.js`** - Adicionar constantes de ataque físico
2. **`js/core/Input.js`** - Adicionar detecção da tecla de ataque
3. **`js/behaviors/PlayerControlBehavior.js`** - Implementar lógica de ataque
4. **`js/audio/SoundEngine.js`** - Adicionar som de ataque físico
5. **`js/rendering/ParticleSystem.js`** - Adicionar efeito visual (opcional)

---

## Mudanças Detalhadas

### 1. `js/constants.js`

**Adicionar após linha 40:**
```javascript
// Physical Attack System
export const DAMAGE_PHYSICAL_ATTACK = 1; // HP de dano do soco
export const PHYSICAL_ATTACK_RANGE = TILE_SIZE * 0.8; // Alcance do ataque
export const PHYSICAL_ATTACK_COOLDOWN = 0.5; // Segundos entre ataques
```

### 2. `js/core/Input.js`

**Adicionar 'KeyF' na lista de gameKeys (linha ~16):**
```javascript
const gameKeys = [
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
    'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyE', 'KeyF',
    'KeyP', 'Escape', 'Enter', 'Backspace'
];
```

**Adicionar getter para ataque físico (após linha 60):**
```javascript
get attack() { return this.wasPressed('KeyF'); }
```

### 3. `js/behaviors/PlayerControlBehavior.js`

**Adicionar imports:**
```javascript
import { DAMAGE_PHYSICAL_ATTACK, PHYSICAL_ATTACK_RANGE, PHYSICAL_ATTACK_COOLDOWN } from '../constants.js';
import { dist } from '../utils.js';
```

**Adicionar propriedade no constructor do Player (em `js/entities/Player.js`):**
```javascript
this.attackCooldown = 0; // Timer de cooldown do ataque físico
```

**No método `update()` do `PlayerControlBehavior.js`, após a lógica de movimento (após linha 37):**
```javascript
// Physical attack
if (input.attack && entity.attackCooldown <= 0) {
    this._performPhysicalAttack(entity, context);
}
```

**Adicionar método para realizar o ataque:**
```javascript
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
            
            // Aplicar dano
            enemy.takeDamage(damage, soundEngine, context.level);
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
```

**No método `update()` do `Player.js`, adicionar atualização do cooldown:**
```javascript
update(dt, context) {
    super.update(dt, context);
    
    // Atualizar cooldown do ataque físico
    if (this.attackCooldown > 0) {
        this.attackCooldown -= dt;
    }

    // ... resto do código existente
}
```

### 4. `js/audio/SoundEngine.js`

**Adicionar cases no método `play()`:**
```javascript
case 'physicalAttackHit': this._physicalAttackHit(ctx); break;
case 'physicalAttackMiss': this._physicalAttackMiss(ctx); break;
```

**Adicionar métodos de som:**
```javascript
_physicalAttackHit(ctx) {
    const now = ctx.currentTime;
    // Som de impacto - mais agudo e percussivo
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
}

_physicalAttackMiss(ctx) {
    const now = ctx.currentTime;
    // Som de "whoosh" - mais suave
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
}
```

### 5. `js/rendering/ParticleSystem.js` (Opcional - para feedback visual)

**Adicionar método para efeito de ataque:**
```javascript
emitPhysicalAttack(x, y, direction, hit) {
    const count = hit ? 8 : 4; // Mais partículas se acertou
    const color = hit ? '#ff4444' : '#888888';
    
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const speed = hit ? 40 + Math.random() * 20 : 20 + Math.random() * 10;
        
        this.particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0.3,
            maxLife: 0.3,
            color: color,
            size: 3 + Math.random() * 2
        });
    }
}
```

**No `Game.js`, adicionar listener para o evento:**
```javascript
EventBus.on('player:physicalAttack', ({ x, y, direction, hit }) => {
    this.renderer.particleSystem.emitPhysicalAttack(x, y, direction, hit);
});
```

---

## Detalhes de Implementação

### Alcance do Ataque

O ataque físico tem alcance de `TILE_SIZE * 0.8` pixels na direção que o player está olhando. Isso permite acertar inimigos em tiles adjacentes.

### Cooldown

O cooldown de `0.5` segundos previne spam de ataques e mantém o combate balanceado. O player ainda pode usar bombas enquanto espera o cooldown.

### Integração com Sistema RPG

O ataque físico respeita:
- **Attack Power**: Multiplica o dano base
- **Crit Chance**: Pode causar dano crítico (2x)
- **Defense do Inimigo**: O `takeDamage()` do inimigo já aplica redução de dano se implementado

### Feedback

- **Visual**: Partículas na direção do ataque (vermelhas se acertou, cinzas se errou)
- **Sonoro**: Som diferente para acerto e erro
- **Tátil**: Cooldown impede ataques muito rápidos

---

## Status: ✅ IMPLEMENTADO

Esta fase foi completamente implementada e testada.
