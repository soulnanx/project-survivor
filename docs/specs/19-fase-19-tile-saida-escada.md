# Project Survivor - Fase 19: Tile de Saída (Escada) no Level

## Contexto

O jogador pode apertar **E** para sair do level (escapar da dungeon e voltar ao HUB) quando está na posição **(1, 1)** — a entrada da dungeon (canto superior esquerdo). Essa posição não tem representação visual especial; é apenas chão normal. O HUD mostra "Press E to Escape" quando o jogador está nessa célula.

Esta fase adiciona uma **representação visual clara da saída**: uma tile diferente (escada ou equivalente) na célula (1, 1) e alteração da tile **acima** (1, 0) para dar a entender que há uma escada saindo do nível.

## Objetivos desta Fase

1. **Tile de saída (1, 1)**: Desenhar nessa célula um visual de saída (escada descendo, alçapão ou equivalente), mantendo a célula caminhável e o gameplay inalterado.
2. **Tile acima (1, 0)**: Alterar o desenho da parede nessa célula para sugerir o topo da escada / abertura, de forma que (1, 0) e (1, 1) juntas contem a “história” visual da escada.
3. **Gameplay**: Nenhuma alteração de regras — (1,1) continua `CELL_EMPTY`, (1,0) continua `CELL_WALL`; tecla E em (1,1) continua saindo do level.

---

## Implementação da Fase 19

### Arquitetura

- **Grid / lógica**: Sem novo tipo de célula. Posição da saída permanece (1, 1); opcional centralizar em constantes (`EXIT_COL`, `EXIT_ROW`) em `constants.js` e usar em `Game._isPlayerAtEntrance()`.
- **Renderização**: Toda a mudança é visual em `BackgroundLayer.js`:
  - Ao desenhar a célula **(1, 1)**: desenhar o chão base e, por cima, o desenho da escada/saída (procedural ou sprite).
  - Ao desenhar a célula **(1, 0)**: usar desenho especial de parede (topo da escada / abertura) em vez do desenho padrão de parede.
- **Temas**: Definir se a escada/abertura se adapta ao tema da dungeon (ruins, subway, etc.) ou se há um visual único para todos.

### Arquivos a Modificar / Criar

1. **`js/rendering/BackgroundLayer.js`** – desenho da tile (1,1) como “chão + escada” e da tile (1,0) como “parede com topo da escada”.
2. **`js/constants.js`** – opcional: constantes `EXIT_COL = 1`, `EXIT_ROW = 1` para um único ponto de verdade.
3. **`js/core/Game.js`** – opcional: usar `EXIT_COL`/`EXIT_ROW` em `_isPlayerAtEntrance()` se as constantes forem adicionadas.
4. **Assets** (se usar sprites): nova pasta/tiles para saída (ex. `assets/tiles/exit/`); caso contrário, desenho procedural no `BackgroundLayer`.

---

## Mudanças Detalhadas

### 1. `js/rendering/BackgroundLayer.js`

- No loop que desenha o grid (dentro de `rebuild()`), ao processar a célula **(1, 1)**:
  - Manter o desenho do chão base (floor/floorAlt).
  - Após o chão, desenhar o elemento visual da **saída** (escada ou equivalente): degraus procedurais ou blit de sprite, respeitando o tema atual (`this.currentTheme`) se for definido suporte por tema.
- Ao processar a célula **(1, 0)** (parede):
  - Em vez de chamar apenas `_drawApocalypticWall()` (ou equivalente), detectar que é a célula (1, 0) e desenhar uma variante “parede com topo de escada / abertura”: por exemplo, abertura na parte inferior da tile ou degraus que se conectem visualmente à escada em (1, 1).

Implementação sugerida:

- Adicionar método `_drawExitTile(ctx, x, y, palette)` para a célula (1, 1): chão já desenhado no loop; chamar este método para desenhar a escada/saída por cima.
- Adicionar método `_drawExitWallTile(ctx, x, y, palette)` para a célula (1, 0): desenhar parede com abertura/topo de escada.
- No loop principal, após desenhar o chão para (c, r), se `c === 1 && r === 1`, chamar `_drawExitTile`. Ao desenhar parede, se `c === 1 && r === 0`, chamar `_drawExitWallTile` em vez do desenho padrão de parede.

### 2. `js/constants.js` (opcional)

Adicionar:

```javascript
// Saída do level (Fase 19 - tile de escada)
export const EXIT_COL = 1;
export const EXIT_ROW = 1;
```

### 3. `js/core/Game.js` (opcional)

Se as constantes forem adicionadas, em `_isPlayerAtEntrance()`:

```javascript
import { EXIT_COL, EXIT_ROW } from '../constants.js';
// ...
return playerCol === EXIT_COL && playerRow === EXIT_ROW;
```

### 4. Assets

- **Opção A**: Desenho procedural em `BackgroundLayer` (degraus, retângulos, linhas) — sem novos arquivos.
- **Opção B**: Sprites/tiles em pasta dedicada (ex. `assets/tiles/exit/stairs.png`, `exit_wall.png`); carregar em `BackgroundLayer` ou em um loader existente e desenhar nas células (1,0) e (1,1).

---

## Decisões em aberto

- **Estilo**: Escada clássica (degraus), escada de corda, alçapão ou apenas abertura na parede + ícone no chão.
- **Temas**: Um desenho por tema (ruins, subway, hospital, etc.) ou um visual único para todos.

---

## Checklist de Aceitação

- [x] Na célula (1, 1) aparece um visual claro de saída (escada ou equivalente).
- [x] Na célula (1, 0) aparece um visual que sugere topo da escada / abertura.
- [x] Gameplay inalterado: E em (1,1) continua saindo do level; (1,0) continua intransitável.
- [x] Opcional: constantes `EXIT_COL`/`EXIT_ROW` e uso em `_isPlayerAtEntrance()`.

---

## Status: ✅ IMPLEMENTADO
