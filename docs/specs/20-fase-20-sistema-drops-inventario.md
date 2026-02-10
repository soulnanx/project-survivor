# Project Survivor - Fase 20: Sistema de Drops e Inventário

## Contexto

Na Fase 11 (Reestruturação Survivor), os power-ups clássicos foram **removidos das dungeons**; o design prevê substituí-los por **drops** (ouro, equipamento, poções). Nesta fase implementa-se **apenas a parte de ouro**: drop determinístico pelo seed, coleta, persistência no save e exibição na UI. Equipamentos e poções ficam para fases futuras.

## Objetivos desta Fase (escopo: ouro)

1. **Drop de ouro**: Ao destruir brick (5% fixo) ou matar inimigo (15–30% pelo seed), spawnar um drop de ouro na célula. Valor do drop: pequeno = 1, médio = 5, grande = 10 (escolha também determinística pelo seed).
2. **Coleta**: Ao passar sobre o drop, o jogador coleta o ouro (soma ao total) e o drop é removido.
3. **Persistência**: Ouro do jogador é salvo e carregado pelo SaveSystem (ex.: `inventory.gold` no formato v4).
4. **UI**: Exibir ouro no HUD (durante a dungeon) e no HUB.

---

## Drop de ouro — regras (escopo atual)

### Determinismo pelo seed

- Toda decisão de drop (se dropa ou não, tamanho do ouro) usa o **PRNG do level** (seed), de forma que a mesma seed reproduz os mesmos drops.

### Chance de drop

- **Brick destruído**: **5%** fixo de chance de dropar ouro.
- **Inimigo morto**: de **15%** a **30%** de chance; o valor exato é **definido pelo seed** do level (reprodutível).

### Tamanhos de ouro

| Tamanho | Valor (ouro) |
|---------|--------------|
| Pequeno | 1 |
| Médio   | 5 |
| Grande  | 10 |

- Qual tamanho dropar (quando houver drop) também é decidido de forma determinística pelo PRNG do level (ex.: roll entre os três tamanhos com pesos ou uniforme).

### Fontes

- **Brick destruído**: ao ser destruído, roll de chance **5%**; se sucesso, spawna drop de ouro (pequeno/médio/grande) na célula do brick.
- **Inimigo morto**: ao morrer, roll de chance **15–30%** (definido pelo seed); se sucesso, spawna drop de ouro na célula do inimigo.

---

## Assets utilizados — ouro (moeda)

- **Imagem de referência da moeda**: Foi criada uma imagem de moeda de ouro para representar o drop de ouro no jogo (visual de ícone, estilo adequado a asset 2D). Serve como referência visual até a criação do sprite final.
- **Caminho sugerido no projeto**: `assets/drops/coin_gold.png` (ou `assets/ui/` para uso no HUD). A imagem de referência pode ser copiada para esse caminho para uso imediato no código.
- **Sprite final**: Será criada pelo autor do projeto uma versão em sprite da moeda (e, se desejado, variantes por tamanho: pequeno / médio / grande). Até lá, o jogo pode usar a imagem de referência da moeda; depois, o asset pode ser trocado pelo sprite sem alterar a lógica.

---

## Escopo futuro (não implementado nesta fase)

- Equipamentos e poções como drops.
- Bônus de conclusão de dungeon (ouro/equipamento raro/XP).
- Slots de inventário para equipamentos e consumíveis.

Definições completas estão em `11-nova-fase-survivor-system.md` e na seção "Definições extraídas" de versões anteriores desta spec.

---

## Implementação da Fase 20 (ouro)

### Arquitetura

- **Chance e tamanho pelo seed**: Brick: 5% fixo. Zumbi: chance 15–30% definida pelo PRNG do level. Valor do drop (1, 5 ou 10) sempre via PRNG.
- **Entidade drop**: Objeto “drop” no level com posição (célula), tipo `gold` e valor (1, 5 ou 10). Renderização: ícone ou sprite por tamanho (pequeno/médio/grande).
- **Coleta**: Detecção de mesma célula player–drop; ao coletar: `player.gold += valor`, remove o drop do level, opcionalmente emite evento (ex.: `drop:collected`, `gold`) para UI/som.
- **Save**: Salvar/carregar `gold` no SaveSystem (ex.: `inventory.gold` no formato v4).

### Arquivos a Modificar / Criar

1. **Sistema de drops (ouro)**: `js/systems/DropSystem.js` — brick: chance 5% fixo; inimigo: chance 15–30% pelo seed; valor 1/5/10 via PRNG.
2. **Entidade drop**: Representação no level (posição, tipo `gold`, valor) e renderização (HUD/grid) por tamanho. Visual: imagem/sprite de moeda (ver seção **Assets utilizados — ouro (moeda)**); sprite final da moeda será criado posteriormente.
3. **Colisão/coleta**: Detectar player na mesma célula que um drop; somar valor ao `player.gold`, remover drop, emitir evento se desejado.
4. **Player / inventário**: Propriedade `gold` no player (ou em objeto de inventário) inicializada em 0; persistida no save.
5. **SaveSystem**: Incluir e restaurar `inventory.gold` (ou equivalente) no payload do save (v4).
6. **UI**: HUD (dungeon) e HUB — exibir quantidade de ouro do jogador.

### Mudanças Detalhadas

- **Chance**: Brick = 5% fixo. Zumbi = `zombieChancePercent` no intervalo [15, 30] derivado do seed. Roll: `prng.random() * 100 < chance` então spawna drop.
- **Tamanho do ouro**: Segundo roll (ou mesmo roll com faixas): decidir pequeno (1), médio (5) ou grande (10); criar drop com esse valor.
- **Coleta**: Em loop de update ou no CollisionSystem, para cada drop no level, se `(playerCol, playerRow) === (dropCol, dropRow)`: adicionar `drop.value` a `player.gold`, remover drop da lista, opcionalmente `EventBus.emit('drop:collected', { type: 'gold', value: drop.value })`.
- **Save**: No SaveSystem, ao salvar estado do player/inventário, incluir `gold`; ao carregar, restaurar `gold`.

---

## Checklist de Aceitação

- [x] Brick: 5% fixo de drop; zumbi: chance no intervalo 15–30% definida pelo seed (reprodutível).
- [x] Ao destruir brick ou matar inimigo, quando o roll de chance passar, spawna um drop de ouro na célula com valor pequeno (1), médio (5) ou grande (10), decidido de forma determinística pelo seed.
- [x] Drops de ouro aparecem no grid e são coletados ao player passar na célula; o valor é somado ao ouro do jogador e o drop é removido.
- [x] Ouro do jogador é persistido no save e restaurado ao carregar.
- [x] Ouro é exibido no HUD (dungeon) e no HUB.

---

## Decisões em aberto

- Distribuição entre tamanhos (pequeno/médio/grande): uniforme ou pesos (ex.: mais comum pequeno)?
- Visual do drop no grid: usar uma única moeda com número ao lado (valor 1/5/10) ou sprite diferente por tamanho (quando o sprite da moeda estiver pronto)?

---

## Status: ✅ IMPLEMENTADO
