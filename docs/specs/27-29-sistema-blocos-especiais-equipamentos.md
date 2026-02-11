# Project Survivor - Fases 27-29: Sistema de Blocos Especiais e Equipamentos

## Contexto

O jogo possui apenas 3 tipos de células: **CELL_EMPTY** (chão vazio), **CELL_WALL** (parede indestrutível), e **CELL_BRICK** (tijolo destrutível por bombas). Esta limitação reduz a profundidade estratégica do jogo.

As Fases 27-29 implementam um **sistema de blocos especiais que requerem equipamentos específicos** para serem quebrados, criando:

1. **Progressão de exploração**: Áreas bloqueadas até adquirir o equipamento correto
2. **Gerenciamento de recursos**: Equipamentos com durabilidade limitada
3. **Economia significativa**: Ouro necessário para comprar equipamentos no HUB
4. **Decisões estratégicas**: Quando usar equipamentos (durabilidade limitada)

---

## Objetivos das Fases

### Fase 27: Blocos Especiais
- Adicionar 3 novos tipos de blocos ao grid
- Blocos especiais são **imunes a bombas** (apenas equipamentos os destroem)
- Aparecem progressivamente por nível
- Dar melhor drop de ouro que bricks normais

### Fase 28: Sistema de Equipamentos
- Implementar 3 equipamentos com durabilidade limitada
- Mecânica de uso: pressionar **E** próximo ao bloco especial
- Animação de punch ao usar equipamento
- Sistema de eventos para integração com outros sistemas

### Fase 29: Loja e Persistência
- Adicionar equipamentos à loja do HUB
- Salvar/carregar durabilidade de equipamentos (SaveSystem v5)
- Compatibilidade com saves antigos (fallback)

---

## Implementação

### FASE 27: Blocos Especiais

#### Novos Tipos de Bloco

```javascript
CELL_WOOD = 3           // Madeira (marrom)
CELL_HARD_BRICK = 5     // Tijolo reforçado (marrom escuro)
CELL_IRON_BARS = 4      // Grade de ferro (cinza)
```

#### Características

| Bloco | Cor | Textura | Min. Nível | Drop Chance |
|-------|-----|---------|-----------|------------|
| Wood | #8B6F47 | Linhas verticais | 2 | 10% |
| Hard Brick | #6B4423 | Reforçado denso | 4 | 12% |
| Iron Bars | #707070 | Barras metálicas | 7 | 15% |

#### Blocos Imunes a Bombas

Explosões param ao atingir blocos especiais **sem destruí-los**:
```javascript
// BombSystem.detonate()
} else if (grid.isSpecialBlock(nc, nr)) {
    // Blocos especiais bloqueiam explosões mas não são destruídos
    break;
}
```

#### Grid Methods

```javascript
isSolid(col, row)       // Inclui blocos especiais
isDestructible(col, row) // Apenas CELL_BRICK (para bombas)
isSpecialBlock(col, row) // Retorna true para os 3 novos blocos
```

#### Renderização (BackgroundLayer.js)

- `_drawWoodTile()` - Textura com linhas verticais (madeira)
- `_drawHardBrickTile()` - Tijolo mais denso e escuro
- `_drawIronBarsTile()` - Barras metálicas com brilho

#### Geração (DungeonGenerator.js)

```javascript
static _generateSpecialBlocks(grid, prng, level) {
    // 10-15% dos bricks viram blocos especiais
    // Distribuição progressiva:
    // Level 2+: 50% Wood
    // Level 4+: 30% Hard Brick
    // Level 7+: 20% Iron Bars
}
```

---

### FASE 28: Sistema de Equipamentos

#### Equipamentos

```javascript
EQUIPMENT_AXE = 'axe'                    // 10 usos, quebra CELL_WOOD
EQUIPMENT_PICKAXE = 'pickaxe'            // 8 usos, quebra CELL_HARD_BRICK
EQUIPMENT_BOLT_CUTTERS = 'boltCutters'   // 6 usos, quebra CELL_IRON_BARS
```

#### Mapeamento Bloco → Equipamento

```javascript
BLOCK_EQUIPMENT_MAP = {
    [CELL_WOOD]: EQUIPMENT_AXE,
    [CELL_HARD_BRICK]: EQUIPMENT_PICKAXE,
    [CELL_IRON_BARS]: EQUIPMENT_BOLT_CUTTERS
}
```

#### Player Equipment

```javascript
player.equipment = {
    axe: 0,           // Durabilidade atual do machado
    pickaxe: 0,       // Durabilidade atual da picareta
    boltCutters: 0    // Durabilidade atual do alicate
}
```

#### EquipmentSystem.js (NOVO)

Sistema responsável por:
- Validar se player tem equipamento necessário
- Quebrar bloco (setCell CELL_EMPTY)
- Decrementar durabilidade
- Emitir eventos:
  - `block:broken` - para drops
  - `equipment:broken` - quando durabilidade = 0
  - `player:physicalAttack` - para animação de punch

#### Input e Uso

**Input.js** - Nova propriedade:
```javascript
get useEquipment() { return this.wasPressed('KeyE'); }
```

**PlayerControlBehavior.js** - Evento de uso:
```javascript
if (input.useEquipment) {
    EventBus.emit('equipment:use', {
        player: entity,
        col: targetCol,
        row: targetRow,
        grid: context.grid,
        soundEngine: context.soundEngine
    });
}
```

#### Display no Inventário

UIRenderer mostra durabilidade à direita da barra:
```
[Axe:10] [Pick:8] [Cut:6]
```

Só aparecem quando durabilidade > 0

#### Drops de Blocos Especiais

DropSystem escuta evento `block:broken`:
```javascript
EventBus.on('block:broken', ({ col, row, type }) => {
    const chances = {
        [CELL_WOOD]: WOOD_DROP_CHANCE,           // 10%
        [CELL_IRON_BARS]: IRON_BARS_DROP_CHANCE, // 15%
        [CELL_HARD_BRICK]: HARD_BRICK_DROP_CHANCE // 12%
    };
    if (chances[type]) {
        this._trySpawnGold(col, row, chances[type]);
    }
});
```

---

### FASE 29: Loja e Persistência

#### Shop Costs

```javascript
SHOP_AXE_COST = 50
SHOP_PICKAXE_COST = 75
SHOP_BOLT_CUTTERS_COST = 100
```

#### Loja HUB

UIRenderer._drawHubShopOverlay mostra:
- Tecla 1: Cura (+5 HP) - 10 ouro
- Tecla 2: Machado (10 usos) - 50 ouro
- Tecla 3: Picareta (8 usos) - 75 ouro
- Tecla 4: Alicate (6 usos) - 100 ouro

#### Compras (Game.js)

```javascript
if (this.input.wasPressed('Digit2')) {
    if (gold >= SHOP_AXE_COST) {
        this.player.gold -= SHOP_AXE_COST;
        this.player.equipment.axe += EQUIPMENT_DURABILITY[EQUIPMENT_AXE];
        this.soundEngine.play('powerup');
    }
}
// Similar para Digit3 (pickaxe) e Digit4 (bolt cutters)
```

#### SaveSystem v5

Persistência de equipamentos:

```javascript
saveData = {
    version: 5,
    player: {
        // ... outras propriedades
        equipment: {
            axe: player.equipment.axe,
            pickaxe: player.equipment.pickaxe,
            boltCutters: player.equipment.boltCutters
        }
    }
}
```

**Backward Compatibility**: Saves v3/v4 recebem equipamento [0, 0, 0]:
```javascript
if (saved.equipment) {
    player.equipment = { ... }
} else {
    // Fallback para saves antigos
    player.equipment = { axe: 0, pickaxe: 0, boltCutters: 0 };
}
```

#### Renderer Update

Evento `block:broken` trigga rebuild da camada de fundo:
```javascript
EventBus.on('block:broken', () => {
    this.renderer.backgroundLayer.rebuild(this.grid, theme, seed);
});
```

---

## Arquivos Modificados

### Criados
- `js/systems/EquipmentSystem.js` (NOVO)

### Atualizados
- `js/constants.js` - 38 novas constantes
- `js/entities/Player.js` - Propriedade equipment
- `js/world/Grid.js` - isSpecialBlock(), isSolid(), isDestructible()
- `js/systems/BombSystem.js` - Blocos especiais bloqueiam explosões
- `js/systems/DropSystem.js` - Drops de blocos especiais
- `js/systems/SaveSystem.js` - Version 5, persistência de equipamentos
- `js/rendering/BackgroundLayer.js` - 3 métodos de renderização
- `js/rendering/UIRenderer.js` - Display de equipamentos + shop UI
- `js/world/DungeonGenerator.js` - _generateSpecialBlocks()
- `js/core/Input.js` - Propriedade useEquipment
- `js/behaviors/PlayerControlBehavior.js` - Evento equipment:use
- `js/core/Game.js` - EquipmentSystem instantiation + shop purchases + block:broken listener

---

## Checklist de Testes

### Teste 1: Geração de Blocos
- [ ] Nível 1: Nenhum bloco especial
- [ ] Nível 2-3: Apenas madeira
- [ ] Nível 4-6: Madeira + tijolo reforçado
- [ ] Nível 7+: Todos os tipos
- [ ] Explosão para no bloco especial (não destrói)

### Teste 2: Compra de Equipamento
- [ ] Comprar Machado: -50 ouro, [Axe:10] aparece no inventário
- [ ] Comprar Picareta: -75 ouro, [Pick:8] aparece
- [ ] Comprar Alicate: -100 ouro, [Cut:6] aparece

### Teste 3: Uso de Equipamento
- [ ] Pressionar E no bloco certo: bloco desaparece
- [ ] Durabilidade diminui: [Axe:10] → [Axe:9]
- [ ] Animação de punch aparece
- [ ] Som de quebra toca

### Teste 4: Durabilidade
- [ ] Usar machado 10 vezes: desaparece após 10º uso
- [ ] "Equipment broken" event dispara
- [ ] Pressionar E sem equipamento não tem efeito

### Teste 5: Drops
- [ ] Madeira dá 10% drop chance (melhor que brick 5%)
- [ ] Valores aleatórios: 1, 5 ou 10 ouro

### Teste 6: Persistência
- [ ] Comprar equipamentos
- [ ] Usar alguns
- [ ] Sair do game (salva)
- [ ] Carregar save
- [ ] Durabilidade preservada

### Teste 7: Seeds Determinísticas
- [ ] Mesmo seed = mesmas posições de blocos especiais
- [ ] Layout reprodutível entre gerações

---

## Decisões de Design

1. **Blocos imunes a bombas (não resistentes)**: Força o uso estratégico de equipamentos; cria identidade clara das ferramentas.

2. **Durabilidade limitada**: Alinha com survival mode (inventário de bombas também limitado); cria economia de ouro.

3. **Uso automático (não teclas por ferramenta)**: Pressionar E próximo ao bloco; sistema detecta qual equipamento usar. Mais intuitivo.

4. **Geração progressiva**: 10-15% de bricks viram blocos especiais; distribuição determinística (seed); balanceamento por nível.

5. **Events para integração**: Emite `block:broken` para DropSystem; `equipment:broken` para feedback; `player:physicalAttack` para animação.

---

## Balanceamento

**Custos vs Gameplay:**
- Player precisa ~2-3 dungeons completas para comprar primeiro equipamento
- Cada equipamento dura ~1.5 dungeons completos
- Blocos especiais dão drops melhores (incentivo)
- Progressão suave: madeira (fácil) → grades (difícil)

**Ajustes Futuros Possíveis:**
- Aumentar/reduzir durabilidade baseado em feedback
- Novos equipamentos (Machado de Ferro +5 durability)
- Novos tipos de blocos (gelo, metal especial)
- Equipamentos com habilidades especiais (área 3x3)

---

## Status: ✅ IMPLEMENTADO

- ✅ Blocos especiais gerando corretamente
- ✅ Imunidade a bombas funcionando
- ✅ Renderização visual dos 3 tipos
- ✅ Sistema de equipamentos com durabilidade
- ✅ Mecânica de uso (E key)
- ✅ Animação de punch
- ✅ Loja no HUB com 3 equipamentos
- ✅ SaveSystem v5 com persistência
- ✅ Backward compatibility com saves antigos
- ✅ Drops de blocos especiais
- ✅ Determinístico via PRNG seed

**Teste inicial**: ✅ Blocos gerando e funcionando no Level 2+
