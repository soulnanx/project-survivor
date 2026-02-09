# Referência de Assets de Sprites - Project Survivor

## Descoberta de Assets (2026-02-09)

O projeto contém uma pasta completa de assets de sprites LPC (Liberated Pixel Cup) prontos para usar:

```
bomberman/assets/sprites/char/
├── character.json           # Metadados e créditos das animações
├── standard/                # Sprites padrão LPC
│   ├── walk/                # Animação de caminhada (9 frames x 4 direções)
│   │   ├── down/            # Caminhada para baixo
│   │   ├── left/            # Caminhada para esquerda
│   │   ├── right/           # Caminhada para direita
│   │   └── up/              # Caminhada para cima
│   ├── idle/                # Animação de parado
│   ├── run/                 # Animação de corrida
│   ├── slash/               # Ataque com lâmina
│   ├── 1h_slash/            # Ataque com arma de uma mão
│   ├── 1h_backslash/        # Ataque inverso
│   ├── 1h_halfslash/        # Meio-ataque
│   ├── combat/              # Pose de combate
│   ├── emote/               # Emotes/animações faciais
│   ├── hurt/                # Animação de dano
│   ├── jump/                # Animação de pulo
│   ├── climb/               # Animação de escalada
│   ├── sit/                 # Pose sentado
│   ├── shoot/               # Pose de atirador
│   ├── spellcast/           # Pose de magia
│   ├── thrust/              # Pose de ataque direto
│   └── watering/            # Pose de regar (não relevante)
├── credits/                 # Diretório de créditos
└── custom/                  # Customizações do usuário
```

## Estrutura de Cada Animação

### Exemplo: `walk/down/`
```
walk/down/
├── 1.png   # Frame 1 da caminhada
├── 2.png   # Frame 2 da caminhada
├── 3.png   # Frame 3 da caminhada
├── 4.png   # Frame 4 da caminhada
├── 5.png   # Frame 5 da caminhada
├── 6.png   # Frame 6 da caminhada
├── 7.png   # Frame 7 da caminhada
├── 8.png   # Frame 8 da caminhada
└── 9.png   # Frame 9 da caminhada
```

**Total**: 9 frames de animação para cada direção
**Direções**: 4 (up, down, left, right)
**Animações Usáveis**: walk, idle, run (as principais)

## Personagem Padrão

O `character.json` descreve o personagem padrão configurado:

```json
{
  "bodyType": "male",
  "selections": {
    "body": "Body Color (light)",
    "head": "Human Male (light)",
    "expression": "Neutral (light)",
    "hair": "Cowlick (black)",
    "beard": "5 O'clock Shadow (black)",
    "legs": "Formal Pants (base)",
    "shoes": "Basic Boots (black)",
    "clothes": "Shortsleeve (black)"
  },
  "enabledAnimations": {
    "walk": true,
    "1h_slash": true,
    ...
  }
}
```

### Aparência
- **Tipo**: Homem humanoid realista
- **Pele**: Tom claro
- **Cabelo**: Preto (cowlick style)
- **Rosto**: Expressão neutra com barba leve
- **Roupa**: Camiseta preta sem mangas
- **Calças**: Calças formais em tom claro
- **Sapatos**: Botas pretas básicas

## Créditos e Licenças

### Licenças Incluídas
- **OGA-BY 3.0** (Open Game Art Attribution)
- **CC-BY-SA 3.0** (Creative Commons Attribution Share-Alike)
- **GPL 3.0** (GNU General Public License)

### Artistas Principais
- bluecarrot16
- Benjamin K. Smith (BenCreating)
- Stephen Challener (Redshrike)
- ElizaWy
- JaidynReiman
- E mais (ver `character.json` para lista completa)

### URLs de Referência
- https://opengameart.org/content/liberated-pixel-cup-lpc-base-assets-sprites-map-tiles
- https://opengameart.org/content/lpc-character-bases
- https://github.com/ElizaWy/LPC/

## Como Usar em Fase 12

### Carregamento de Imagens
```javascript
// Em Game.js ou EntityRenderer.js
async loadPlayerSprites() {
    const directions = ['up', 'down', 'left', 'right'];
    const frames = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    this.spriteFrames = {};

    for (const direction of directions) {
        this.spriteFrames[direction] = [];

        for (const frame of frames) {
            const path = `assets/sprites/char/standard/walk/${direction}/${frame}.png`;
            const img = new Image();
            img.src = path;
            this.spriteFrames[direction].push(img);
        }
    }
}
```

### Renderização
```javascript
drawPlayer(ctx, player) {
    const { x, y, direction, animTimer, moving } = player;

    const frames = this.spriteFrames[direction];
    const frameIndex = moving
        ? Math.floor((animTimer * 10) % frames.length)
        : 0;

    const img = frames[frameIndex];
    const size = TILE_SIZE * 0.9;

    ctx.drawImage(img, x - size/2, y - size/2, size, size);
}
```

## Notas Importantes

1. **Tamanho**: As imagens provavelmente são 64x64px (padrão LPC). Ajustar escala conforme necessário.

2. **Transparência**: Imagens têm fundo transparente (PNG com alpha).

3. **Direções**:
   - Sprites em cada direção são diferentes
   - Não é possível apenas rotacionar - precisa de imagens específicas

4. **Animações Futuras**: Se precisar de outras animações (run, slash, etc.), a estrutura é a mesma.

5. **Customização**: É possível usar o gerador LPC para criar variações (diferentes roupas, cores, etc.) em futuras fases.

## Alternativas Não Implementadas

### Zombis
- Os assets padrão NÃO incluem sprites de zumbis
- Opções: Manter procedural, gerar customizado, usar filtros de cor
- Recomendado para Fase 12: Manter procedural (já feito na Fase 14)

### Variações
- Possível adicionar variações (female, diferentes roupas, etc.) via gerador LPC
- Recomendado para fases posteriores (Phase 20+)

---

**Data**: 2026-02-09
**Status**: Pronto para integração na Fase 12
