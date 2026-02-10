# Project Survivor - Fase 24: Aumentar Tamanho do Jogador e do Zumbi

## Contexto

Atualmente o jogador e os zumbis são desenhados com tamanho igual à tile (48×48 px), usando escala `TILE_SIZE / SPRITE_SIZE` (0,75) para os sprites 64×64. O fallback procedural usa `TILE_SIZE * 0.7`. O resultado é que as entidades ficam visualmente pequenas em relação ao grid.

Esta fase aumenta o tamanho de exibição do **jogador** e do **zumbi** de forma configurável, mantendo a lógica de jogo (colisão, grid) inalterada — apenas o desenho fica maior.

## Objetivos desta Fase

1. **Jogador maior**: Aumentar o tamanho visual do sprite e do fallback procedural do jogador (ex.: ~10–20% maior que a tile).
2. **Zumbi maior**: Aumentar o tamanho visual do sprite e do fallback procedural dos zumbis na mesma proporção (ou configurável).
3. **Configurável**: Usar constantes em `constants.js` para escala e offset vertical (`PLAYER_SPRITE_SCALE`, `ZOMBIE_SPRITE_SCALE`, `PLAYER_SPRITE_OFFSET_Y`, `ZOMBIE_SPRITE_OFFSET_Y`).
4. **Offset vertical**: Deslocar o desenho para cima (valores negativos em px) para que os pés não invadam o bloco abaixo.
5. **Gameplay inalterado**: Posição e colisão continuam baseados no centro da entidade; apenas o desenho muda.

---

## Implementação da Fase 24

### Arquitetura

- **Lógica**: Nenhuma alteração em `Player.js`, `Enemy.js` ou em colisões. O centro (x, y) das entidades permanece o mesmo.
- **Renderização**: Em `EntityRenderer.js`, o tamanho de desenho do jogador e do zumbi passa a ser `TILE_SIZE * fator`, onde o fator é lido de constantes (ex.: 1.0 = atual, 1.15 = 15% maior).
- **Constantes**: Em `constants.js`: escala visual (`PLAYER_SPRITE_SCALE`, `ZOMBIE_SPRITE_SCALE`) e offset vertical em px (`PLAYER_SPRITE_OFFSET_Y`, `ZOMBIE_SPRITE_OFFSET_Y`). Valores atuais: escala 1.50 (~50% maior que a tile), offset -15 (desenho 15 px para cima).

### Arquivos a Modificar / Criar

1. **`js/constants.js`** – `PLAYER_SPRITE_SCALE`, `ZOMBIE_SPRITE_SCALE`, `PLAYER_SPRITE_OFFSET_Y`, `ZOMBIE_SPRITE_OFFSET_Y`.
2. **`js/rendering/EntityRenderer.js`** – usar escala e offset no desenho do jogador e do zumbi (sprite e procedural); barra de HP do inimigo com offset.

---

## Mudanças Detalhadas

### 1. `js/constants.js`

Adicionar após a configuração de sprites do zumbi (por exemplo após `ZOMBIE_FRAME_COUNT`):

```javascript
// Escala visual do jogador e do zumbi (Fase 24 - tamanho na tela)
// 1.0 = tamanho da tile (48px), 1.50 ≈ 50% maior
export const PLAYER_SPRITE_SCALE = 1.50;
export const ZOMBIE_SPRITE_SCALE = 1.50;
// Offset vertical (px): negativo = desenha mais para cima, evita pés invadirem bloco abaixo
export const PLAYER_SPRITE_OFFSET_Y = -15;
export const ZOMBIE_SPRITE_OFFSET_Y = -15;
```

Valores atuais: escala 1.50, offset -15. Ajustar em `constants.js` conforme feedback visual.

### 2. `js/rendering/EntityRenderer.js`

**Imports:** adicionar `PLAYER_SPRITE_SCALE`, `ZOMBIE_SPRITE_SCALE`, `PLAYER_SPRITE_OFFSET_Y`, `ZOMBIE_SPRITE_OFFSET_Y` ao import de `constants.js`.

**Jogador (sprite):** onde hoje se usa `scale = TILE_SIZE / SPRITE_SIZE` e `drawWidth`/`drawHeight` derivados, passar a calcular o tamanho final aplicando `PLAYER_SPRITE_SCALE`:

- Tamanho base = `TILE_SIZE` (ou equivalente ao atual 48px).
- Tamanho de desenho = `TILE_SIZE * PLAYER_SPRITE_SCALE` para largura e altura (mantendo posição centralizada em `player.x`, `player.y`).

**Jogador (procedural):** onde hoje se usa `size = TILE_SIZE * 0.7`, usar algo como `size = TILE_SIZE * 0.7 * PLAYER_SPRITE_SCALE` (ou definir tamanho direto em função de `TILE_SIZE * PLAYER_SPRITE_SCALE` para consistência com o sprite).

**Zumbi (sprite):** mesmo raciocínio — tamanho de desenho = `TILE_SIZE * ZOMBIE_SPRITE_SCALE`, centralizado na posição do inimigo.

**Zumbi (procedural):** onde hoje se usa `size = TILE_SIZE * 0.7`, usar `TILE_SIZE * 0.7 * ZOMBIE_SPRITE_SCALE` (ou equivalente).

- **Offset vertical:** aplicar `PLAYER_SPRITE_OFFSET_Y` / `ZOMBIE_SPRITE_OFFSET_Y` em `drawY` (sprites) e em `ctx.translate(x, y + OFFSET_Y)` (procedural), e na posição da barra de HP do inimigo. Assim o desenho sobe e os pés não invadem o bloco abaixo; colisão permanece no (x, y) lógico.

---

## Checklist de Aceitação

- [x] Constantes `PLAYER_SPRITE_SCALE`, `ZOMBIE_SPRITE_SCALE`, `PLAYER_SPRITE_OFFSET_Y`, `ZOMBIE_SPRITE_OFFSET_Y` em `constants.js`.
- [x] Jogador (sprite e procedural) desenhado com escala e offset vertical.
- [x] Zumbi (sprite e procedural) desenhado com escala e offset vertical.
- [x] Posição e colisão do jogador e dos inimigos inalteradas; apenas o desenho está maior e deslocado para cima.
- [x] Barra de HP e outros overlays continuam alinhados (barra do inimigo usa offset).

---

## Status: ✅ IMPLEMENTADO
