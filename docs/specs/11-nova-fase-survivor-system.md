# Fase 11+: Project Survivor - Reestruturação para Permadeath

## Visão Geral

O jogo evolui de uma progressão linear de 10 níveis para um **survival game com permadeath** inspirado em Project Zomboid. O jogador cria um personagem, explora dungeons, acumula recursos e equipamentos enquanto estiver vivo. A morte é permanente e absoluta: perde tudo.

**Não existe condição de vitória.** O objetivo é sobreviver o máximo possível. A métrica de sucesso é: quantas dungeons completou, que level alcançou, quanto ouro acumulou, quanto tempo sobreviveu.

---

## Princípios de Design

### 1. Morte é permanente e irreversível
- Morreu → save deletado → personagem perdido para sempre
- Não existe "Continue" após a morte
- Toda decisão tem peso porque a perda é total

### 2. Save agressivo e anti-save-scum
- Save automático ao **completar uma dungeon**
- Save automático ao **tomar dano**
- O jogador não pode fechar o jogo para desfazer um erro
- Tomou dano? Já está gravado. Não tem volta.

### 3. Escape como válvula de segurança
- O jogador pode **fugir** de uma dungeon a qualquer momento
- A decisão central do jogo é: **"continuo arriscando ou saio agora?"**
- Fugir não é vergonha, é estratégia. Morrer é a punição por ganância.

### 4. Recursos são finitos e valiosos
- HP só recupera com itens de cura (drops ou loja)
- Sem cura automática entre dungeons
- Cada ponto de HP perdido é um recurso gasto

### 5. Sobrevivência pura
- Sem "zerar o jogo", sem boss final, sem fim
- Sempre existem mais dungeons
- A dificuldade escala infinitamente
- O high score é o legado do personagem

---

## Ciclo de Jogo

```
┌──────────────┐
│  MAIN MENU   │
│              │──→ New Game → Cria personagem → HUB
│              │──→ Continue → Carrega save → HUB
│              │──→ High Scores (recordes de runs anteriores)
└──────────────┘
       │
       ▼
┌──────────────┐
│     HUB      │  Zona segura entre dungeons
│  (Seguro)    │  - Ver stats do personagem
│              │  - Ver inventário
│              │  - Loja (cura, itens) [futuro]
│              │  - Escolher próxima dungeon
│              │  - Save automático ao entrar
└──────┬───────┘
       │ escolhe dungeon
       ▼
┌──────────────┐
│   DUNGEON    │  Gameplay survival (já existente)
│  (Perigo)    │  - Inimigos, bombas, destruição
│              │  - Drops: ouro, equipamento, poções
│              │  - Save automático ao tomar dano
│              │  - Pode ESCAPAR voltando à entrada
└──────┬───────┘
       │
       ├─→ ESCAPE (volta à entrada da dungeon)
       │   → Retorna ao HUB com loot coletado
       │   → Sem bônus de conclusão
       │
       ├─→ COMPLETOU (matou todos os inimigos)
       │   → Retorna ao HUB com loot + bônus de conclusão
       │   → Save automático
       │
       └─→ MORREU
           → Save deletado permanentemente
           → Tela de Game Over (stats finais do personagem)
           → High Score registrado
           → Volta ao Main Menu
```

---

## Mecânica de Escape

### Como funciona
- O jogador precisa **voltar à posição de entrada da dungeon** (tile de spawn, posição 1,1)
- Ao pisar na entrada, aparece a opção de fugir
- Pode ser ativado a qualquer momento durante a dungeon

### Regras
- **Leva tudo que coletou** na dungeon (ouro, itens, poções usadas contam como usadas)
- **Sem bônus de conclusão** (diferente de completar a dungeon)
- **A dungeon NÃO é marcada como concluída** (pode ser re-explorada com layout diferente)

### Design rationale
- A punição de NÃO escapar (morte = perde personagem inteiro) já é severa o suficiente
- Não precisa de custo adicional no escape
- O escape é a ferramenta do jogador inteligente
- Cria a tensão central: "estou com 3 HP, tem 2 inimigos vivos, tenho um item raro... fujo ou arrisco?"

---

## Sistema de Save

### Quando salva automaticamente
1. **Ao completar uma dungeon** - salva estado completo (player stats, inventário, ouro, dungeons completadas)
2. **Ao tomar dano** - salva HP atual e estado do jogador
3. **Ao entrar no HUB** - salva estado seguro

### Quando deleta o save
1. **Ao morrer** - wipe total, save apagado permanentemente

### Comportamento ao fechar o jogo
- **No HUB:** estado salvo, volta ao HUB ao continuar
- **Na dungeon:** volta ao HUB com o **último estado salvo** (que inclui qualquer dano tomado nessa dungeon, já que dano triggera save). Progresso da dungeon (kills, loot não coletado) é perdido.

### Dados do save (evolução do SaveSystem atual)

```javascript
{
    version: 4,  // Nova versão do save
    timestamp: Date.now(),

    // Identidade da run
    run: {
        id: "unique-run-id",       // ID único da run
        startedAt: timestamp,       // Quando começou
        dungeonsCompleted: 0,       // Contador de dungeons
        totalKills: 0,              // Total de inimigos mortos
        survivalTime: 0,            // Tempo total de sobrevivência
    },

    // Estado do player
    player: {
        level: 1,
        xp: 0,
        hp: 20,
        maxHp: 20,
        speed: 120,
        maxBombs: 1,
        bombRange: 1,
        defense: 0,
        attackPower: 1.0,
        critChance: 0,
    },

    // Inventário [futuro - Fase 13]
    inventory: {
        gold: 0,
        slots: [],       // Array de items equipados
        maxSlots: 4,
    },

    // Estado do HUB [futuro - Fase 14]
    hub: {
        availableDungeons: [],  // Dungeons disponíveis para escolher
    }
}
```

---

## Drops em Dungeon

### O que substitui os power-ups clássicos

Os power-ups tradicionais (bomb, flame, speed, health) **são removidos das dungeons**. Em seu lugar:

| Drop | Fonte | Efeito |
|------|-------|--------|
| **Ouro** | Bricks destruídos, inimigos mortos | Moeda para a loja no HUB |
| **Equipamento** | Bricks destruídos (raro), inimigos fortes | Item que ocupa slot de inventário |
| **Poção pequena** | Bricks destruídos (incomum) | Cura +5 HP imediatamente ao coletar |

### Bônus de conclusão de dungeon
Ao matar **todos** os inimigos e completar a dungeon:
- Bônus de ouro (proporcional à dificuldade)
- Chance extra de equipamento raro
- XP bônus

---

## Sistema de Inventário [Documentação - Implementação Futura]

### Conceito
- **Slots limitados** (4-6 slots iniciais)
- Equipamentos dão bônus passivos enquanto equipados
- Consumíveis usam slot mas são descartados ao usar
- Trade-off: levar poção = 1 slot a menos para equipamento

### Tipos de Equipamento (conceito)

| Slot | Item | Bônus |
|------|------|-------|
| Corpo | Armadura | +defense |
| Acessório | Anel de Força | +attackPower |
| Acessório | Amuleto Crítico | +critChance |
| Pés | Botas | +speed |
| Utilidade | Bolsa de Bombas | +maxBombs |
| Utilidade | Lente de Alcance | +bombRange |

### Raridade

| Raridade | Cor | Multiplicador de stats |
|----------|-----|----------------------|
| Comum | Branco | 1x |
| Incomum | Verde | 1.5x |
| Raro | Azul | 2.5x |

### Consumíveis

| Item | Efeito | Obtido em |
|------|--------|-----------|
| Poção Pequena | +5 HP | Drop em dungeon |
| Poção Grande | +15 HP | Loja no HUB |
| Poção Completa | Full HP | Loja no HUB (caro) |

---

## Loja no HUB [Documentação - Implementação Futura]

### Conceito
- Acessível apenas no HUB (zona segura)
- Usa ouro como moeda
- Inventário da loja pode variar entre visitas (seed-based?)

### Itens à venda

| Categoria | Exemplos | Preço estimado |
|-----------|----------|---------------|
| Cura | Poção Pequena (+5 HP) | 10 ouro |
| Cura | Poção Grande (+15 HP) | 30 ouro |
| Cura | Poção Completa (full HP) | 80 ouro |
| Equipamento | Item aleatório comum | 50 ouro |
| Equipamento | Item aleatório incomum | 150 ouro |
| Utilidade | +1 slot de inventário | 200 ouro |

### Design rationale
- O ouro coletado em dungeons precisa ter uso
- Cura por recurso é a única forma de recuperar HP
- Preços calibrados para que o jogador não possa curar infinitamente
- Decisões: "curo agora ou guardo ouro para equipamento melhor?"

---

## Variedade de Dungeons [PENDÊNCIA - Implementação Futura]

### Problema
Com sobrevivência infinita e sem condição de vitória, as dungeons precisam de variedade para o jogo não ficar repetitivo. O DungeonGenerator atual gera layouts procedurais, mas todos seguem o mesmo template.

### Soluções planejadas

#### Tipos de Dungeon
| Tipo | Descrição | Característica |
|------|-----------|---------------|
| Caverna | Muitos bricks, espaço apertado | Alta densidade de drops |
| Arena | Poucos bricks, espaço aberto | Muitos inimigos, combate intenso |
| Labirinto | Corredores estreitos, poucas saídas | Navegação desafiadora |
| Fortaleza | Sala grande com mini-boss | Risco alto, recompensa alta |

#### Modificadores de Dungeon
- "Amaldiçoada": inimigos com +50% HP
- "Rica": dobro de drops de ouro
- "Sombria": visibilidade reduzida (fog of war?)
- "Infestada": dobro de inimigos

#### Dificuldade Escalonada
- Tier 1-3: Fácil (inimigos fracos, poucos)
- Tier 4-6: Médio (inimigos variados, quantidade moderada)
- Tier 7-9: Difícil (inimigos fortes, muitos)
- Tier 10+: Pesadelo (escala infinitamente)

#### Seleção de Dungeon
- No HUB, o jogador vê 2-3 dungeons disponíveis
- Cada uma com tipo, tier e modificadores visíveis
- O jogador escolhe qual enfrentar
- Após completar/escapar, novas dungeons são geradas

### Status: PENDENTE
Esta feature é essencial para o jogo não ficar repetitivo mas será implementada em fases futuras. Prioridade alta após o sistema base estar funcionando.

---

## Transição: Do Modelo Atual para o Novo

### O que muda

| Componente | Antes | Depois |
|-----------|-------|--------|
| `Game.js` - estados | MENU → PLAYING → GAME_OVER | MENU → HUB → DUNGEON → HUB/GAME_OVER |
| `Game.js` - vitória | STATE_VICTORY ao level 10 | Removido. Não existe vitória. |
| `SaveSystem.js` | Save na morte (permite continue) | Save no dano e na conclusão. Morte = delete. |
| `SaveSystem.js` | Versão 3 | Versão 4 (novo formato com run data) |
| Power-ups em dungeon | bomb/flame/speed/health drops | ouro/equipamento/poção drops |
| Progressão | Níveis 1-10 lineares | Dungeons infinitas, escolha do jogador |
| Menu principal | Start/Continue/Seed | New Game/Continue/High Scores |
| Entre dungeons | Transição automática | HUB (tela de preparação) |
| HP entre dungeons | Implícito (novo level = reset) | Persiste. Cura só por recurso. |

### O que permanece igual
- Gameplay core (survival + inimigos + bombas)
- Sistema de HP do player e inimigos
- Sistema de XP e levels
- Stats RPG (defense, attackPower, critChance)
- DungeonGenerator (geração procedural)
- PRNG (seeds determinísticas)
- SoundEngine e ParticleSystem
- Rendering (EntityRenderer, UIRenderer base)

---

## Fases de Implementação

### Fase 11: Reestruturação do Fluxo de Jogo
**Prioridade: ALTA - É o alicerce de tudo**

Escopo:
- Novo estado `STATE_HUB` no Game.js
- Tela de HUB minimalista (stats + "Entrar na Dungeon")
- "New Game" cria personagem zerado → HUB
- "Continue" carrega save → HUB
- Completar dungeon → HUB
- Escape da dungeon (voltar à entrada) → HUB
- Morte → delete save → Game Over → Menu
- Remover STATE_VICTORY e progressão linear de 10 níveis
- Remover power-ups clássicos das dungeons

### Fase 12: Save System v4
**Prioridade: ALTA**

Escopo:
- Novo formato de save (versão 4, com run data)
- Save automático ao tomar dano
- Save automático ao completar dungeon
- Delete save na morte
- Run ID e métricas de sobrevivência
- Migração de saves antigos (v3 → v4)

### Fase 13: Sistema de Drops e Inventário
**Prioridade: MÉDIA**

Escopo:
- Substituir power-ups por drops (ouro, equipamento, poção)
- Sistema de inventário com slots limitados
- Equipamentos com stats e raridade
- Poções como consumíveis
- UI de inventário no HUB

### Fase 14: Variedade de Dungeons
**Prioridade: MÉDIA**

Escopo:
- Tipos de dungeon (caverna, arena, labirinto, fortaleza)
- Modificadores de dungeon
- Tiers de dificuldade escalonados
- Seleção de dungeon no HUB (2-3 opções)

### Fase 15: Loja no HUB
**Prioridade: BAIXA (pode vir antes da 14)**

Escopo:
- Interface de loja no HUB
- Comprar cura com ouro
- Comprar equipamentos
- Inventário da loja variável

### Fase 16+: Polish e Expansão
- Novos tipos de inimigos
- Mini-bosses
- Fog of war
- Mais equipamentos e raridades
- Achievements / recordes detalhados
- Meta-progressão? (a avaliar - pode quebrar o espírito permadeath)

---

## Métricas de High Score

Quando o personagem morre, registrar:

```javascript
{
    runId: "unique-id",
    date: "2026-02-09",
    playerLevel: 7,
    dungeonsCompleted: 12,
    totalKills: 89,
    goldEarned: 450,
    survivalTime: "23min 14s",  // Tempo total jogado com esse personagem
    causeOfDeath: "enemy_touch", // ou "explosion"
    lastDungeon: {
        type: "arena",
        tier: 5,
    }
}
```

Top 10 runs salvas no localStorage (persiste entre runs, nunca é deletado).

---

## Decisões em Aberto

1. **Escala de dificuldade infinita:** Como escalar inimigos infinitamente sem ficar injusto? Mais HP? Mais velocidade? Novos tipos? Combinação?
2. **Balanceamento de ouro:** Quanto ouro por dungeon? Preços na loja? Precisa de playtesting.
3. **Equipamento duplicado:** O que acontece se encontrar um item que já tem? Pode vender? Substituir? Descartar?
4. **Velocidade do jogador:** Botas de speed stackam infinitamente? Precisa de cap.
5. **Dungeons multi-andar:** Uma dungeon pode ter múltiplos andares? Isso adiciona complexidade mas também profundidade.

---

## Referências de Design

- **Project Zomboid:** Permadeath absoluto, resources matter, cada decisão pesa
- **Spelunky:** Dungeons procedurais, runs curtas, morte punitiva
- **Enter the Gungeon:** Drops de equipamento, escape como mecânica
- **Darkest Dungeon:** Inventário limitado, HP como recurso, retreat como estratégia
