# Fase 12: Integração de Sprites LPC

## Visão Geral

Substituição do sistema de renderização procedural por sprites profissionais LPC (Liberated Pixel Cup) para player e inimigos, mantendo fallback procedural para robustez.

**Data:** 2026-02-09
**Status:** ✅ COMPLETO
**Escopo:** Player + Enemies (Zombies)

---

## Problema Solucionado

O jogo usava desenho procedural (linhas, formas) para renderizar:
- ❌ Player: stick figure genérico
- ❌ Inimigos: formas básicas

Isso resultava em visual amador e não alinhado com o tema apocalíptico.

---

## Solução Implementada

### 1. SpriteLoader (Player)

**Arquivo:** `js/rendering/SpriteLoader.js`

```javascript
- Carrega 36 frames (9 × 4 direções)
- Origem: assets/sprites/char/standard/walk/
- Async non-blocking
- 5s timeout por imagem
- Fallback automático se falhar
```

**Características:**
- ✅ Tenta caminho absoluto: `/bomberman/assets/sprites/char/standard/walk`
- ✅ Se falhar, tenta relativo: `assets/sprites/char/standard/walk`
- ✅ Graceful degradation para procedural

### 2. ZombieLoader (Enemies)

**Arquivo:** `js/rendering/ZombieLoader.js`

```javascript
- Carrega 36 frames (9 × 4 direções)
- Origem: assets/sprites/zombie/standard/walk/
- Async non-blocking
- 5s timeout por imagem
- Fallback automático se falhar
```

**Características:**
- ✅ Mesma estrutura do SpriteLoader
- ✅ Suporta caminhos duplos
- ✅ Animação mais lenta (8 fps vs 12 fps player)

### 3. Modificações EntityRenderer

**Arquivo:** `js/rendering/EntityRenderer.js`

#### Player Rendering
```javascript
drawPlayer()
  → _drawPlayerSprite()    [if sprites ready]
    └─ _calculateSpriteFrame()
  → _drawPlayerProcedural() [fallback]
```

#### Enemy Rendering
```javascript
drawEnemy()
  → _drawZombieSprite()      [if sprites ready]
    └─ _calculateZombieFrame()
  → _drawZombieProcedural()  [fallback]
```

### 4. Constantes Adicionadas

**Arquivo:** `js/constants.js`

```javascript
// Player Sprites
export const SPRITE_SIZE = 64;
export const SPRITE_ANIMATION_FPS = 12;
export const SPRITE_IDLE_FRAME = 5;
export const SPRITE_FRAME_COUNT = 9;

// Zombie Sprites
export const ZOMBIE_SPRITE_SIZE = 64;
export const ZOMBIE_ANIMATION_FPS = 8;  // Mais lento
export const ZOMBIE_IDLE_FRAME = 5;
export const ZOMBIE_FRAME_COUNT = 9;
```

---

## Assets Utilizados

### Player Sprites
```
bomberman/assets/sprites/char/standard/walk/
├── down/  (9 frames)
├── up/    (9 frames)
├── left/  (9 frames)
└── right/ (9 frames)
```

### Zombie Sprites
```
bomberman/assets/sprites/zombie/standard/walk/
├── down/  (9 frames)
├── up/    (9 frames)
├── left/  (9 frames)
└── right/ (9 frames)
```

**Especificações:**
- Formato: PNG 64×64 com transparência
- License: OGA-BY 3.0, CC-BY-SA 3.0, GPL 3.0
- Total: 72 imagens (~2-3 MB)

---

## Arquitetura

### Fluxo de Renderização

1. **Inicialização:**
   ```
   EntityRenderer constructor
     ├─ SpriteLoader.loadPlayerSprites() [async]
     └─ ZombieLoader.loadZombieSprites() [async]
   ```

2. **Renderização por Frame:**
   ```
   render()
     ├─ drawPlayer()
     │   └─ if (spriteLoader.isReady()) → _drawPlayerSprite()
     │       else → _drawPlayerProcedural()
     │
     └─ drawEnemy()
         └─ if (zombieLoader.isReady()) → _drawZombieSprite()
             else → _drawZombieProcedural()
   ```

3. **Cálculo de Frame:**
   ```
   Player:   frame = floor(animTimer × 12) % 9 + 1
   Zombie:   frame = floor(animTimer × 8) % 9 + 1

   Idle:     frame = 5 (sempre)
   Moving:   frame = animador
   ```

### Escalas

- Sprites fonte: 64×64 px
- Alvo: 48×48 px (TILE_SIZE)
- Scale factor: 0.75x

---

## Comportamento

### Loading

- ✅ **Non-blocking:** Jogo inicia com procedural, sprites aparecem quando prontos
- ✅ **Console logging:**
  - Sucesso: `✓ Player sprites loaded (36 frames) from: ...`
  - Erro: `⚠ Sprite loading failed, using procedural fallback`

### Animation

| Aspecto | Player | Zombie |
|---------|--------|--------|
| **FPS** | 12 | 8 |
| **Idle Frame** | 5 | 5 |
| **Total Frames** | 36 | 36 |
| **Loop** | Contínuo | Contínuo |

### Fallback

- Se sprite não carregar → procedural automático
- Se sprite não existir para frame → procedural para aquele frame
- HP bar mantém-se funcional em ambos casos

---

## Game Logic Intacto

✅ **Nenhuma mudança em:**
- `Player.js` - Mesmas propriedades e métodos
- `Enemy.js` - Mesmas propriedades e métodos
- Física, colisões, HP, dano, XP
- Todos os eventos do EventBus

---

## Testes Realizados

### Testes Manuais
- ✅ Player move em 4 direções com sprite correto
- ✅ Zombie move em 4 direções com sprite correto
- ✅ Animação fluida em 12/8 fps
- ✅ Fallback procedural funciona se sprites falhem
- ✅ HP bars visíveis em ambos modos (sprite/procedural)
- ✅ Nenhum aumento de lag (60 fps mantido)

### Debug
- Arquivos de teste criados:
  - `test_sprite_loader.html` - Testa carregamento de sprites
  - `test_sprite_loading.html` - Testa HTTP e Image API
  - `SPRITE_DEBUG.md` - Guia de diagnóstico

---

## Mudanças no Repositório

### Arquivos Criados
- ✨ `js/rendering/SpriteLoader.js`
- ✨ `js/rendering/ZombieLoader.js`
- ✨ `test_sprite_loader.html`
- ✨ `test_sprite_loading.html`
- ✨ `docs/specs/12-fase-12-sprite-integration.md` (este arquivo)

### Arquivos Modificados
- 📝 `js/rendering/EntityRenderer.js` - Refatorado para sprites
- 📝 `js/constants.js` - Adicionadas 8 constantes
- 📝 `README.md` - Status atualizado
- 📝 `CONTEXT.md` - Phase 12 marcada como completa

---

## Próximas Fases

### Fase 13 (Opcional)
- Adicionar animações adicionais (idle, run, attack)
- Suportar diferentes tipos de zombie (visual distinct)

### Fase 14 (Em Progresso)
- Continuar transformação apocalíptica
- Efeitos visuais adicionais
- Sons temáticos

### Fase 16
- Sistema de knockback
- Aumentar HP dos zombies

---

## Referências

- **LPC Assets:** `bomberman/assets/sprites/`
- **Sprite Loader:** `js/rendering/SpriteLoader.js`
- **Zombie Loader:** `js/rendering/ZombieLoader.js`
- **Entity Renderer:** `js/rendering/EntityRenderer.js`
- **Constants:** `js/constants.js`

---

## Conclusão

Phase 12 completada com sucesso. O jogo agora utiliza sprites profissionais LPC para todas as entidades, mantendo fallback procedural para robustez máxima. Nenhuma mudança em game logic, apenas visual.

Impacto:
- 🎨 Qualidade visual: Excelente ↑
- ⚡ Performance: Mantida (60 fps) →
- 🛡️ Robustez: Aumentada (fallback) ↑
- 📝 Code complexity: Mínima ↑
