# Project Survivor - Fase 18: Animação Slash do Ataque Físico

## Contexto

A **Fase 15** implementou o ataque físico na tecla **F** (punch/soco): detecção de inimigos, dano, cooldown, som e partículas. Porém, o jogador continua exibindo o sprite de **walk** ou idle durante o golpe. Esta fase adiciona a **animação visual de slash** usando os sprites da pasta `assets/sprites/char/standard/slash/`, para que o personagem mostre o movimento de ataque (slash) enquanto a tecla F é executada.

## Objetivos desta Fase

1. **Exibir animação de slash** quando o jogador apertar **F** (ataque físico)
2. **Usar os sprites** da pasta `char/standard/slash/` (6 frames por direção: up, down, left, right)
3. **Priorizar slash sobre walk**: durante a duração da animação de slash, desenhar os frames de slash em vez dos de walk/idle
4. **Manter** toda a lógica já existente da Fase 15 (dano, cooldown, som, partículas)

---

## Assets Utilizados

A pasta já existente no projeto:

```
assets/sprites/char/standard/slash/
├── down/   (1.png … 6.png)
├── up/     (1.png … 6.png)
├── left/   (1.png … 6.png)
└── right/  (1.png … 6.png)
```

- **6 frames** por direção (total 24 imagens)
- Mesmo formato esperado: PNG (ex.: 64×64 com transparência), compatível com o padrão LPC do personagem

---

## Implementação da Fase 18

### Arquitetura

- **SpriteLoader**: passar a carregar também os sprites de `slash/` (além de `walk/`), com chaves que permitam obter frame por direção (ex.: `player_slash_down_1` … `player_slash_down_6`, e o mesmo para up/left/right).
- **Player**: novo estado `slashAnimTimer` (segundos restantes da animação). Quando > 0, o renderer usa a animação de slash.
- **PlayerControlBehavior**: ao executar o ataque físico (tecla F), além do cooldown, definir `entity.slashAnimTimer = SLASH_ANIMATION_DURATION`.
- **EntityRenderer**: em `_drawPlayerSprite`, se `player.slashAnimTimer > 0`, calcular o frame de slash a partir do tempo restante e desenhar com `getSlashSprite(direction, frame)`; caso contrário, manter comportamento atual (walk/idle).
- **constants.js**: duração da animação slash e número de frames (ex.: `SLASH_ANIMATION_DURATION`, `SLASH_FRAME_COUNT`).

### Arquivos a Modificar / Criar

1. **`js/constants.js`** – constantes da animação slash
2. **`js/rendering/SpriteLoader.js`** – carregar sprites de `slash/` e expor `getSlashSprite(direction, frameIndex)`
3. **`js/entities/Player.js`** – propriedade `slashAnimTimer` e decremento no `update()`
4. **`js/behaviors/PlayerControlBehavior.js`** – ao realizar ataque físico, setar `entity.slashAnimTimer`
5. **`js/rendering/EntityRenderer.js`** – priorizar animação slash quando `slashAnimTimer > 0`

---

## Mudanças Detalhadas

### 1. `js/constants.js`

Adicionar constantes da animação slash (após as constantes de ataque físico, ex.: após `PHYSICAL_ATTACK_COOLDOWN`):

```javascript
// Slash animation (Fase 18 - visual do ataque físico)
export const SLASH_FRAME_COUNT = 6;           // 6 frames por direção na pasta slash/
export const SLASH_ANIMATION_DURATION = 0.4;  // Duração em segundos da animação na tela
```

### 2. `js/rendering/SpriteLoader.js`

- **Carregar** além de `walk`, a pasta `slash`: mesmo padrão de caminhos (absoluto e relativo), direções `['down','up','left','right']`, frames 1 a 6.
- **Chave** sugerida: `player_slash_${direction}_${frame}` (ex.: `player_slash_down_1`).
- **Método** `getSlashSprite(direction, frameIndex)`:
  - `frameIndex` entre 1 e 6 (clamped).
  - Retornar `this.sprites[key]` com key `player_slash_${direction}_${frame}`.
- **Ordem de carregamento**: pode carregar walk e slash em paralelo (dois conjuntos de `Promise.all`) ou em sequência; o importante é que `loaded` só seja `true` quando ambos estarem carregados (ou manter um `slashLoaded` e `isReady()` considerar ambos se quiser fallback separado).
- **Fallback**: se slash falhar, o jogo pode continuar usando apenas walk durante o ataque (comportamento atual); não é obrigatório fallback procedural para slash.

### 3. `js/entities/Player.js`

- No **constructor**, inicializar:
  - `this.slashAnimTimer = 0;`
- No **update(dt, context)**:
  - Se `this.slashAnimTimer > 0`, decrementar: `this.slashAnimTimer -= dt;` (não deixar negativo).

### 4. `js/behaviors/PlayerControlBehavior.js`

- Importar `SLASH_ANIMATION_DURATION` de `constants.js`.
- Dentro de `_performPhysicalAttack`, após aplicar o cooldown (ex.: `entity.attackCooldown = PHYSICAL_ATTACK_COOLDOWN`), adicionar:
  - `entity.slashAnimTimer = SLASH_ANIMATION_DURATION;`
- Assim, sempre que o ataque for executado (tecla F), a animação de slash será exibida por `SLASH_ANIMATION_DURATION` segundos.

### 5. `js/rendering/EntityRenderer.js`

- Em **`_drawPlayerSprite(ctx, player)`**:
  - Se `player.slashAnimTimer > 0`:
    - Calcular o frame da animação slash: o tempo já decorrido da animação é `SLASH_ANIMATION_DURATION - player.slashAnimTimer`. Converter para frame 1–6 usando duração total e `SLASH_FRAME_COUNT` (ex.: progresso 0→1, depois `frame = 1 + Math.floor(progresso * SLASH_FRAME_COUNT)` com clamp para não ultrapassar 6).
    - Obter sprite com `this.spriteLoader.getSlashSprite(player.direction, frame)`.
    - Se o sprite existir, desenhar esse sprite (mesma escala e posição que o walk). Se não existir, fallback para o comportamento atual (walk/idle).
  - Senão:
    - Manter lógica atual: `_calculateSpriteFrame(animTimer, moving)` e `getSprite(direction, frameIndex)` para walk/idle.

- Importar em `EntityRenderer`: `SLASH_ANIMATION_DURATION`, `SLASH_FRAME_COUNT` de `constants.js`.

---

## Detalhes de Implementação

### Cálculo do frame de slash

- `elapsed = SLASH_ANIMATION_DURATION - player.slashAnimTimer`
- `progress = Math.min(1, elapsed / SLASH_ANIMATION_DURATION)`
- Frame (1-based): `frame = Math.min(SLASH_FRAME_COUNT, 1 + Math.floor(progress * SLASH_FRAME_COUNT))`  
  ou equivalente que distribua os 6 frames ao longo de `SLASH_ANIMATION_DURATION`.

### Direção

- Usar sempre `player.direction` (já atualizada pelo movimento/input) para escolher a pasta `down/`, `up/`, `left/`, `right/` dos sprites de slash.

### Duração

- `SLASH_ANIMATION_DURATION = 0.4` segundos deixa a animação visível e alinhada ao tempo do golpe; pode ser ajustada depois para combinar com o som e o cooldown.

### Cooldown vs animação

- O **cooldown** (ex.: 0,5 s) continua controlando quando o próximo ataque pode ser disparado.
- A **animação** (0,4 s) só afeta o que é desenhado; o jogador pode estar em cooldown ainda enquanto a animação termina (normal).

---

## Checklist de Aceitação

- [ ] Ao apertar **F**, o ataque físico é executado (dano, som, partículas) como na Fase 15.
- [ ] Durante a execução do ataque, o sprite do personagem exibe a animação da pasta **slash** na direção atual (up/down/left/right).
- [ ] A animação usa os 6 frames da pasta `assets/sprites/char/standard/slash/<direction>/`.
- [ ] Após a duração da animação, o personagem volta a exibir walk/idle normalmente.
- [ ] Se os sprites de slash não carregarem, o jogo não quebra (fallback para walk/idle ou aviso no console).

---

## Status: ⬜ PENDENTE

Esta fase está pronta para implementação. Depende da Fase 15 (ataque físico) e dos assets em `assets/sprites/char/standard/slash/`.
