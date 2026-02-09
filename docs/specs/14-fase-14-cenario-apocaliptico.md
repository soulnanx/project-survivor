# Fase 14: Project Survivor - Transformação do Cenário Apocalíptico

## Visão Geral

O jogo ainda mantém uma forte conexão visual e conceitual com Bomberman (grid de blocos, bombas, layout clássico). Esta fase visa **transformar completamente o cenário** em um mundo pós-apocalíptico devastado, onde o jogador é um sobrevivente explorando ruínas urbanas infestadas por zumbis.

**Objetivo:** Criar uma identidade visual e narrativa única, distanciando-se completamente do tema Bomberman e estabelecendo Project Survivor como um survival game apocalíptico autêntico.

---

## Narrativa e Lore

### O Mundo Apocalíptico

**O Evento:** Um cataclismo desconhecido devastou a civilização. Cidades foram reduzidas a escombros, a população foi transformada em zumbis ou morta, e os sobreviventes se escondem em bunkers e refúgios improvisados.

**O HUB:** Não é mais uma "zona segura genérica", mas sim um **Bunker Subterrâneo** ou **Refúgio Fortificado** onde sobreviventes se reúnem. É um lugar escuro, iluminado por lanternas e fogueiras, com paredes de concreto rachadas e equipamentos improvisados.

**As Dungeons:** Não são mais "dungeons genéricas", mas sim:
- **Ruínas Urbanas**: Prédios destruídos, escritórios abandonados, lojas saqueadas
- **Estações de Metrô**: Túneis escuros e úmidos, plataformas abandonadas
- **Hospitais Abandonados**: Corredores sinistros, quartos vazios, laboratórios
- **Fábricas Desativadas**: Máquinas enferrujadas, áreas industriais perigosas
- **Escolas Abandonadas**: Salas de aula vazias, corredores estreitos
- **Supermercados Saqueados**: Corredores largos, prateleiras vazias

**O Jogador:** Um sobrevivente solitário que precisa explorar essas áreas perigosas para coletar recursos, equipamentos e suprimentos. Cada dungeon é uma missão de sobrevivência.

**Os Inimigos:** Não são mais "fantasmas" ou "monstros genéricos", mas sim **zumbis** em diferentes estágios de decomposição:
- **Wanderer**: Zumbi básico, lento, em decomposição inicial
- **Chaser**: Zumbi mais agressivo, ainda com músculos funcionais
- **Smart**: Zumbi mutante, mais inteligente, possivelmente infectado há mais tempo

---

## Transformações Visuais

### 14.1 Background e Ambiente

**Problema Atual:** O background é um grid simples com tiles básicos, muito similar ao Bomberman clássico.

**Solução:** Criar backgrounds temáticos por tipo de dungeon, com elementos visuais apocalípticos.

#### BackgroundLayer.js - Novos Estilos

**Arquivo:** `js/rendering/BackgroundLayer.js`

**Mudanças necessárias:**

1. **Sistema de Temas de Dungeon**
   - Cada dungeon tem um `theme` (ruins, subway, hospital, factory, school, supermarket)
   - O tema afeta cores, texturas e elementos decorativos do background

2. **Paleta de Cores Apocalíptica**
   - **Ruínas Urbanas**: Tons de cinza, marrom, tijolo queimado
   - **Metrô**: Tons escuros, azul acinzentado, verde musgo
   - **Hospital**: Branco sujo, verde hospitalar desbotado, sangue seco
   - **Fábrica**: Ferrugem, metal escuro, poeira
   - **Escola**: Amarelo desbotado, verde escolar antigo
   - **Supermercado**: Cores desbotadas, prateleiras vazias

3. **Elementos Decorativos**
   - **Paredes Destruídas**: Rachaduras, buracos, reboco faltando
   - **Detritos**: Escombros, móveis quebrados, vidros quebrados
   - **Iluminação Sombria**: Áreas escuras, pontos de luz (lanternas, fogueiras)
   - **Grafites e Marcas**: Sinais de perigo, avisos, marcas de zumbis
   - **Sangue e Manchas**: Resquícios de violência, manchas no chão

**Implementação:**

```javascript
// BackgroundLayer.js - Novo método drawApocalypticBackground
drawApocalypticBackground(ctx, grid, theme = 'ruins') {
    const { width, height, tiles } = grid;
    const tileSize = TILE_SIZE;

    // Paleta de cores por tema
    const themes = {
        ruins: {
            floor: '#4a4a3a',      // Chão de concreto sujo
            wall: '#5a4a3a',       // Parede de tijolo queimado
            crack: '#3a2a1a',      // Rachaduras escuras
            debris: '#6a5a4a',     // Detritos
            blood: '#4a1a1a',      // Sangue seco
        },
        subway: {
            floor: '#2a2a3a',      // Chão de concreto úmido
            wall: '#3a3a4a',       // Parede de azulejo sujo
            crack: '#1a1a2a',      // Rachaduras
            debris: '#4a4a5a',     // Detritos
            moss: '#2a4a2a',       // Musgo verde
        },
        hospital: {
            floor: '#e0e0d0',      // Chão hospitalar sujo
            wall: '#c0c0b0',       // Parede branca desbotada
            crack: '#a0a090',      // Rachaduras
            debris: '#d0d0c0',     // Detritos
            blood: '#8a1a1a',      // Sangue
        },
        // ... outros temas
    };

    const palette = themes[theme] || themes.ruins;

    // Desenhar chão base
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const tile = tiles[y][x];
            const px = x * tileSize;
            const py = y * tileSize;

            // Chão
            ctx.fillStyle = palette.floor;
            ctx.fillRect(px, py, tileSize, tileSize);

            // Textura de sujeira (padrão procedural)
            if (this._prng.random() > 0.7) {
                ctx.fillStyle = palette.crack;
                ctx.fillRect(px + 2, py + 2, tileSize - 4, tileSize - 4);
            }

            // Parede sólida
            if (tile === 1) {
                ctx.fillStyle = palette.wall;
                ctx.fillRect(px, py, tileSize, tileSize);

                // Rachaduras nas paredes
                if (this._prng.random() > 0.6) {
                    this._drawCrack(ctx, px, py, tileSize, palette.crack);
                }

                // Detritos ao redor de paredes
                if (this._prng.random() > 0.8) {
                    this._drawDebris(ctx, px, py, tileSize, palette.debris);
                }
            }

            // Manchas de sangue (ocasionalmente)
            if (tile === 0 && this._prng.random() > 0.95) {
                this._drawBloodStain(ctx, px, py, tileSize, palette.blood);
            }
        }
    }

    // Iluminação sombria (overlay escuro com pontos de luz)
    this._drawDarknessOverlay(ctx, width, height, tileSize);
}

_drawCrack(ctx, x, y, size, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    const startX = x + size * 0.2;
    const startY = y + size * 0.3;
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX + size * 0.3, startY + size * 0.2);
    ctx.lineTo(startX + size * 0.1, startY + size * 0.5);
    ctx.stroke();
}

_drawDebris(ctx, x, y, size, color) {
    ctx.fillStyle = color;
    const debrisSize = size * 0.15;
    ctx.fillRect(x + size * 0.1, y + size * 0.8, debrisSize, debrisSize);
}

_drawBloodStain(ctx, x, y, size, color) {
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.ellipse(x + size/2, y + size/2, size * 0.3, size * 0.2, Math.PI/4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
}

_drawDarknessOverlay(ctx, width, height, tileSize) {
    // Overlay escuro geral
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, width * tileSize, height * tileSize);

    // Pontos de luz (lanternas, fogueiras) - posições aleatórias mas consistentes
    const lightSources = this._generateLightSources(width, height);
    for (const light of lightSources) {
        this._drawLightSource(ctx, light.x * tileSize, light.y * tileSize, tileSize);
    }
}

_drawLightSource(ctx, x, y, tileSize) {
    // Gradiente radial de luz
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, tileSize * 2);
    gradient.addColorStop(0, 'rgba(255, 200, 100, 0.4)'); // Laranja quente
    gradient.addColorStop(0.5, 'rgba(255, 200, 100, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(x - tileSize * 2, y - tileSize * 2, tileSize * 4, tileSize * 4);
}
```

---

### 14.2 Blocos Destrutíveis como Escombros

**Problema Atual:** Os "bricks" são blocos genéricos, sem identidade apocalíptica.

**Solução:** Transformar bricks em **escombros, móveis quebrados, barricadas** que fazem sentido no contexto apocalíptico.

**Mudanças em EntityRenderer.js:**

```javascript
// EntityRenderer.js - Novo método drawDebris
drawDebris(ctx, brick) {
    const { x, y } = brick;
    const size = TILE_SIZE * 0.9;

    // Tipos de escombros (baseado em seed para consistência)
    const debrisType = this._getDebrisType(x, y);

    switch (debrisType) {
        case 'furniture':
            // Móvel quebrado (cadeira, mesa)
            ctx.fillStyle = '#6a5a4a';
            ctx.fillRect(x - size/2, y - size/2, size, size * 0.6);
            // Detalhes de madeira quebrada
            ctx.strokeStyle = '#4a3a2a';
            ctx.lineWidth = 2;
            ctx.strokeRect(x - size/2, y - size/2, size, size * 0.6);
            break;

        case 'barricade':
            // Barricada improvisada (madeira e metal)
            ctx.fillStyle = '#5a4a3a';
            ctx.fillRect(x - size/2, y - size/2 + size * 0.3, size, size * 0.4);
            // Placas de madeira
            ctx.fillStyle = '#7a6a5a';
            for (let i = 0; i < 3; i++) {
                ctx.fillRect(x - size/2 + i * size/3, y - size/2, size/4, size * 0.3);
            }
            break;

        case 'rubble':
            // Escombros de concreto
            ctx.fillStyle = '#6a6a6a';
            ctx.beginPath();
            ctx.moveTo(x - size/2, y - size/2);
            ctx.lineTo(x + size/2, y - size/2);
            ctx.lineTo(x + size/3, y + size/2);
            ctx.lineTo(x - size/3, y + size/2);
            ctx.closePath();
            ctx.fill();
            break;

        case 'vehicle':
            // Veículo abandonado (carro, moto)
            ctx.fillStyle = '#4a4a4a';
            ctx.fillRect(x - size/2, y - size/2, size, size * 0.5);
            // Janelas quebradas
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(x - size/3, y - size/2 + 5, size/3, size/4);
            break;

        default:
            // Escombros genéricos
            ctx.fillStyle = '#5a5a4a';
            ctx.fillRect(x - size/2, y - size/2, size, size);
    }

    // Efeito de deterioração (manchas, ferrugem)
    if (Math.random() > 0.7) {
        ctx.fillStyle = 'rgba(100, 50, 0, 0.3)';
        ctx.fillRect(x - size/2, y - size/2, size, size);
    }
}
```

---

### 14.3 Explosões como Destruição Apocalíptica

**Problema Atual:** As explosões são círculos coloridos simples, sem contexto narrativo.

**Solução:** Transformar explosões em **destruição realista** com fogo, fumaça e detritos voando.

**Mudanças em Explosion.js e ParticleSystem.js:**

```javascript
// Explosion.js - Visual mais apocalíptico
draw(ctx) {
    const { x, y, radius, timer, maxTimer } = this;
    const progress = timer / maxTimer;

    // Fogo central (laranja/vermelho)
    const fireGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    fireGradient.addColorStop(0, '#ff6600');
    fireGradient.addColorStop(0.5, '#ff3300');
    fireGradient.addColorStop(1, '#cc0000');

    ctx.fillStyle = fireGradient;
    ctx.globalAlpha = 1 - progress;
    ctx.beginPath();
    ctx.arc(x, y, radius * (1 - progress * 0.5), 0, Math.PI * 2);
    ctx.fill();

    // Fumaça escura ao redor
    const smokeGradient = ctx.createRadialGradient(x, y, radius * 0.5, x, y, radius * 1.5);
    smokeGradient.addColorStop(0, 'rgba(50, 50, 50, 0.6)');
    smokeGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = smokeGradient;
    ctx.beginPath();
    ctx.arc(x, y, radius * 1.5 * (1 - progress), 0, Math.PI * 2);
    ctx.fill();

    // Partículas de detritos voando
    this._drawDebrisParticles(ctx, progress);

    ctx.globalAlpha = 1.0;
}

_drawDebrisParticles(ctx, progress) {
    // Pequenos pedaços de escombros voando
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 / 8) * i;
        const distance = this.radius * progress * 1.5;
        const px = this.x + Math.cos(angle) * distance;
        const py = this.y + Math.sin(angle) * distance;

        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(px - 2, py - 2, 4, 4);
    }
}
```

---

### 14.4 Bombas como Explosivos Improvisados

**Problema Atual:** As bombas são círculos simples com timer, sem identidade apocalíptica.

**Solução:** Transformar bombas em **explosivos improvisados** (granadas caseiras, dinamite, IEDs) que fazem sentido no contexto de sobrevivência.

**Mudanças em Bomb.js:**

```javascript
// Bomb.js - Visual de explosivo improvisado
draw(ctx) {
    const { x, y, timer, maxTimer } = this;
    const size = TILE_SIZE * 0.6;
    const progress = timer / maxTimer;

    // Piscar antes de explodir
    const blink = Math.floor(progress * 10) % 2 === 0;

    if (blink) {
        // Corpo da bomba (latas, garrafas, pacotes)
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(x - size/2, y - size/2, size, size * 0.7);

        // Detalhes de explosivo improvisado
        ctx.strokeStyle = '#ff6600';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - size/2 + 2, y - size/2 + 2, size - 4, size * 0.7 - 4);

        // Pavio (fio ou corda)
        ctx.strokeStyle = '#8a6a4a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + size/2, y - size/2);
        ctx.lineTo(x + size/2 + 5, y - size/2 - 5);
        ctx.stroke();

        // Chama no pavio (quando próximo de explodir)
        if (progress > 0.7) {
            ctx.fillStyle = '#ff3300';
            ctx.beginPath();
            ctx.arc(x + size/2 + 5, y - size/2 - 5, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
```

---

### 14.5 UI com Estética Apocalíptica

**Problema Atual:** A UI é funcional mas genérica, sem identidade visual.

**Solução:** Transformar a UI em uma **interface de sobrevivente**, com elementos rústicos, improvisados e desgastados.

**Mudanças em UIRenderer.js:**

```javascript
// UIRenderer.js - UI apocalíptica
drawHUD(ctx, player, gameState) {
    // Background da HUD (painel improvisado)
    ctx.fillStyle = 'rgba(30, 30, 30, 0.8)';
    ctx.fillRect(10, 10, 200, 100);

    // Borda desgastada
    ctx.strokeStyle = '#5a4a3a';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 200, 100);

    // Rachaduras no painel (detalhe visual)
    ctx.strokeStyle = '#3a2a1a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(15, 15);
    ctx.lineTo(20, 18);
    ctx.moveTo(200, 20);
    ctx.lineTo(205, 25);
    ctx.stroke();

    // HP Bar (barra de vida com visual rústico)
    this._drawRusticHPBar(ctx, 20, 20, player);

    // XP Bar (barra de experiência)
    this._drawRusticXPBar(ctx, 20, 45, player);

    // Stats (texto com fonte "improvisada")
    ctx.fillStyle = '#d0d0a0';
    ctx.font = '12px monospace';
    ctx.fillText(`Level ${player.level}`, 20, 70);
    ctx.fillText(`HP: ${player.hp}/${player.maxHp}`, 20, 85);
}

_drawRusticHPBar(ctx, x, y, player) {
    const width = 180;
    const height = 12;

    // Background da barra (metal enferrujado)
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(x, y, width, height);

    // Barra de HP (vermelho sangue)
    const hpPercent = player.hp / player.maxHp;
    ctx.fillStyle = hpPercent > 0.5 ? '#8a1a1a' : '#ff3300';
    ctx.fillRect(x + 2, y + 2, (width - 4) * hpPercent, height - 4);

    // Borda de metal
    ctx.strokeStyle = '#5a4a3a';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);

    // Texto "HP"
    ctx.fillStyle = '#d0d0a0';
    ctx.font = '10px monospace';
    ctx.fillText('HP', x - 25, y + 10);
}
```

---

## Sistema de Temas de Dungeon

### 14.6 Integração com DungeonGenerator

**Arquivo:** `js/world/DungeonGenerator.js`

**Mudanças:**

1. Adicionar propriedade `theme` ao gerador
2. Cada dungeon gerada tem um tema aleatório (ou baseado em tier)
3. O tema afeta:
   - Background visual
   - Tipos de escombros (bricks)
   - Densidade de elementos decorativos
   - Paleta de cores

```javascript
// DungeonGenerator.js
generate(seed, width, height, difficulty = 1) {
    // ... código existente ...

    // Escolher tema baseado em dificuldade ou aleatório
    const themes = ['ruins', 'subway', 'hospital', 'factory', 'school', 'supermarket'];
    const theme = themes[Math.floor(this.prng.random() * themes.length)];

    // ... gerar dungeon ...

    return {
        grid,
        enemies,
        theme,  // Novo: tema da dungeon
        seed,
        difficulty,
    };
}
```

---

## Efeitos Sonoros Apocalípticos

### 14.7 Atualização do SoundEngine

**Arquivo:** `js/audio/SoundEngine.js`

**Mudanças:**

1. Sons de ambiente por tema:
   - **Ruínas**: Vento, escombros caindo
   - **Metrô**: Eco, gotejamento, trilhos distantes
   - **Hospital**: Portas rangendo, equipamentos quebrados
   - **Fábrica**: Máquinas paradas, metal rangendo

2. Sons de explosão mais realistas:
   - Explosão com eco
   - Estilhaços voando
   - Fumaça se dissipando

3. Sons de zumbis:
   - Gemidos e grunhidos
   - Passos arrastados
   - Gritos ao serem atingidos

---

## Implementação Detalhada

### Fase 14.1: Background Apocalíptico
**Prioridade: ALTA**

- [ ] Criar sistema de temas em `BackgroundLayer.js`
- [ ] Implementar paletas de cores por tema
- [ ] Adicionar elementos decorativos (rachaduras, detritos, sangue)
- [ ] Sistema de iluminação sombria
- [ ] Integrar temas com `DungeonGenerator`

### Fase 14.2: Escombros e Blocos
**Prioridade: ALTA**

- [ ] Transformar bricks em escombros temáticos
- [ ] Criar diferentes tipos de escombros (móveis, barricadas, veículos)
- [ ] Adicionar detalhes de deterioração
- [ ] Integrar com sistema de temas

### Fase 14.3: Explosões Realistas
**Prioridade: MÉDIA**

- [ ] Redesenhar explosões com fogo e fumaça
- [ ] Adicionar partículas de detritos
- [ ] Efeitos de iluminação dinâmica

### Fase 14.4: Bombas Improvisadas
**Prioridade: MÉDIA**

- [ ] Visual de explosivos improvisados
- [ ] Pavio com chama
- [ ] Animação de piscar antes de explodir

### Fase 14.5: UI Apocalíptica
**Prioridade: MÉDIA**

- [ ] Redesenhar HUD com estética rústica
- [ ] Barras de HP/XP com visual desgastado
- [ ] Textos com fonte "improvisada"
- [ ] Detalhes de deterioração na UI

### Fase 14.6: Sons Apocalípticos
**Prioridade: BAIXA**

- [ ] Sons de ambiente por tema
- [ ] Explosões mais realistas
- [ ] Sons de zumbis

---

## Considerações de Design

### Consistência Visual
- Todos os elementos devem seguir a mesma paleta de cores apocalíptica
- Manter legibilidade mesmo com tons escuros
- Contraste suficiente para gameplay funcional

### Performance
- Elementos decorativos devem ser otimizados
- Iluminação dinâmica pode ser custosa - considerar LOD (Level of Detail)
- Partículas devem ter limites

### Narrativa
- Cada elemento visual deve contar uma história
- Detritos, sangue e destruição devem fazer sentido no contexto
- Evitar elementos genéricos ou sem propósito

---

## Referências Visuais

- **The Last of Us**: Ruínas urbanas, vegetação retomando, atmosfera sombria
- **Project Zomboid**: Estética pixel art apocalíptica, UI rústica
- **Fallout**: Mundo pós-apocalíptico, elementos improvisados
- **Darkest Dungeon**: Estética sombria e desgastada, UI com personalidade

---

## Status: ✅ IMPLEMENTADO (80% - Core Completo)

Esta fase transformou completamente a identidade visual do jogo, estabelecendo Project Survivor como um survival game apocalíptico único e imersivo, completamente distante do tema Bomberman original.

### O que foi Implementado ✅

1. **Background & Temas (14.1)** - 100% ✅
   - 6 dungeons temáticas (ruínas, metrô, hospital, fábrica, escola, supermercado)
   - Paletas de cores apocalípticas por tema
   - Elementos decorativos (rachaduras, destroços, manchas de sangue)
   - Overlay de escuridão com fontes de luz

2. **Explosões Apocalípticas (14.3)** - 100% ✅
   - Gradientes de fogo (laranja/vermelho)
   - Overlay de fumaça
   - Partículas de destroços
   - Animação progressiva

3. **UI Apocalíptica (14.5)** - 100% ✅
   - HUD rústico com cores apocalípticas
   - Rachaduras decorativas nos painéis
   - Barra de HP estilo sangue/metal
   - Fonte monoespaçada para visual "improvisado"

4. **Redesign de Zumbis** - 100% ✅
   - 3 tipos de zumbis com aparências distintas
   - Pele em tons apocalípticos
   - Roupas rasgadas
   - Feridas/rachaduras
   - Olhos brilhantes
   - Animações lentas/arrastadas

### O que Não foi Implementado ❌ (Polimento Opcional)

1. **Escombros Temáticos Variados (14.2)** - 30% apenas
   - Blocos são caixas simples com cores apocalípticas
   - Faltam: Móveis, barricadas, veículos variados por tema
   - Impacto: Médio (visual mais imersivo)

2. **Bombas como Explosivos Improvisados (14.4)** - 0%
   - Bombas são esferas pretas simples
   - Faltam: Aparência improvisada (latas, garrafas, fios, fita)
   - Impacto: Médio (imersão na temática)

3. **Sons Apocalípticos (14.7)** - 0%
   - Sons procedurais genéricos
   - Faltam: Sons ambientes por tema, zumbis, explosões realistas
   - Impacto: Baixo (gameplay não afetado)

### Correções Implementadas

- **Consistência de elementos decorativos**: Elementos decorativos (sujeira, sangue, rachaduras, detritos) são pré-calculados e armazenados para garantir que não mudem de posição após explosões que destroem bricks.
- **Consistência de fontes de luz**: Posições das fontes de luz são armazenadas e reutilizadas durante toda a dungeon, garantindo iluminação consistente.

### Conclusão

O objetivo principal da Fase 14 - **transformar a identidade visual de Bomberman para um survival game apocalíptico** - foi **alcançado com sucesso**. Os 20% faltantes são features de polimento que não afetam o gameplay ou a experiência principal.
