import {
    COLS, ROWS, TILE_SIZE, HUD_HEIGHT,
    CELL_WALL, CELL_BRICK, CELL_EMPTY,
    EXIT_COL, EXIT_ROW,
    COLOR_FLOOR, COLOR_FLOOR_ALT,
    COLOR_WALL, COLOR_WALL_LIGHT, COLOR_WALL_DARK,
    COLOR_BRICK, COLOR_BRICK_LIGHT, COLOR_BRICK_DARK
} from '../constants.js';
import PRNG from '../utils/PRNG.js';

export default class BackgroundLayer {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = COLS * TILE_SIZE;
        this.canvas.height = ROWS * TILE_SIZE;
        this.ctx = this.canvas.getContext('2d');
        this.dirty = true;
        this.currentTheme = 'ruins';
        this.prng = null;
        this.lightSources = null; // Armazenar posições das fontes de luz
        this.decorativeTiles = null; // Armazenar quais tiles têm elementos decorativos
    }

    rebuild(grid, theme = 'ruins', seed = null) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const newSeed = seed || Date.now();
        const themeChanged = this.currentTheme !== theme;
        const seedChanged = !this.prng || this.prng.seed !== newSeed;
        
        // Só regenerar elementos decorativos se o tema ou seed mudaram
        if (themeChanged || seedChanged || !this.prng || !this.decorativeTiles) {
            this.currentTheme = theme;
            this.prng = new PRNG(newSeed);
            // Gerar e armazenar posições das fontes de luz
            this.lightSources = this._generateLightSources(COLS, ROWS);
            // Pré-calcular quais tiles terão elementos decorativos
            this.decorativeTiles = this._generateDecorativeTiles(COLS, ROWS);
        }

        // Paleta de cores por tema
        const themes = {
            ruins: {
                floor: '#4a4a3a',
                floorAlt: '#3a3a2a',
                wall: '#5a4a3a',
                wallLight: '#6a5a4a',
                wallDark: '#3a2a1a',
                crack: '#3a2a1a',
                debris: '#6a5a4a',
                blood: '#4a1a1a',
            },
            subway: {
                floor: '#2a2a3a',
                floorAlt: '#1a1a2a',
                wall: '#3a3a4a',
                wallLight: '#4a4a5a',
                wallDark: '#2a2a3a',
                crack: '#1a1a2a',
                debris: '#4a4a5a',
                moss: '#2a4a2a',
                blood: '#3a1a1a',
            },
            hospital: {
                floor: '#e0e0d0',
                floorAlt: '#d0d0c0',
                wall: '#c0c0b0',
                wallLight: '#d0d0c0',
                wallDark: '#a0a090',
                crack: '#a0a090',
                debris: '#d0d0c0',
                blood: '#8a1a1a',
            },
            factory: {
                floor: '#3a3a3a',
                floorAlt: '#2a2a2a',
                wall: '#4a4a3a',
                wallLight: '#5a5a4a',
                wallDark: '#2a2a1a',
                crack: '#2a2a1a',
                debris: '#5a5a4a',
                rust: '#8a4a1a',
                blood: '#4a1a1a',
            },
            school: {
                floor: '#d0c0a0',
                floorAlt: '#c0b090',
                wall: '#b0a080',
                wallLight: '#c0b090',
                wallDark: '#908070',
                crack: '#908070',
                debris: '#c0b090',
                blood: '#6a1a1a',
            },
            supermarket: {
                floor: '#c0c0c0',
                floorAlt: '#b0b0b0',
                wall: '#a0a0a0',
                wallLight: '#b0b0b0',
                wallDark: '#808080',
                crack: '#808080',
                debris: '#b0b0b0',
                blood: '#5a1a1a',
            },
            // HUB (Fase 23) - zona segura, visual acolhedor
            hub: {
                floor: '#6b5b4a',
                floorAlt: '#5a4a3a',
                wall: '#8b7355',
                wallLight: '#9c8465',
                wallDark: '#5a4a35',
                crack: '#5a4a35',
                debris: '#7a6a55',
                blood: '#4a1a1a',
            },
        };

        const palette = themes[theme] || themes.ruins;

        // Desenhar chão base com padrão apocalíptico
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const x = c * TILE_SIZE;
                const y = r * TILE_SIZE;
                const cell = grid.getCell(c, r);

                // Chão base
                ctx.fillStyle = (c + r) % 2 === 0 ? palette.floor : palette.floorAlt;
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

                // Verificar se este tile tem elementos decorativos pré-calculados
                const tileKey = `${c},${r}`;
                const tileDecor = this.decorativeTiles[tileKey];

                // Textura de sujeira procedural (usar dados pré-calculados) — não na tile de saída
                if (cell === CELL_EMPTY && tileDecor && tileDecor.hasDirt && !(c === EXIT_COL && r === EXIT_ROW)) {
                    ctx.fillStyle = palette.crack;
                    ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                }

                // Parede sólida (tile acima da saída = abertura/escada)
                if (cell === CELL_WALL) {
                    if (c === EXIT_COL && r === EXIT_ROW - 1) {
                        this._drawExitWallTile(ctx, x, y, palette);
                    } else {
                        this._drawApocalypticWall(ctx, x, y, palette, tileDecor);
                    }
                } else if (cell === CELL_BRICK) {
                    // Desenhar escombros apocalípticos
                    this._drawDebrisTile(ctx, x, y, TILE_SIZE, palette, c, r);
                }

                // Manchas de sangue ocasionais (usar dados pré-calculados) — não na tile de saída
                if (cell === CELL_EMPTY && tileDecor && tileDecor.hasBlood && !(c === EXIT_COL && r === EXIT_ROW)) {
                    this._drawBloodStain(ctx, x, y, TILE_SIZE, palette.blood);
                }

                // Tile de saída (escada) — Fase 19
                if (cell === CELL_EMPTY && c === EXIT_COL && r === EXIT_ROW) {
                    this._drawExitTile(ctx, x, y, palette);
                }
            }
        }

        // Iluminação sombria (overlay escuro com pontos de luz)
        this._drawDarknessOverlay(ctx, COLS, ROWS, TILE_SIZE);

        this.dirty = false;
    }

    _drawApocalypticWall(ctx, x, y, palette, tileDecor = null) {
        const s = TILE_SIZE;
        const b = 4;

        // Main face
        ctx.fillStyle = palette.wall;
        ctx.fillRect(x, y, s, s);

        // Top/left highlight
        ctx.fillStyle = palette.wallLight;
        ctx.fillRect(x, y, s, b);
        ctx.fillRect(x, y, b, s);

        // Bottom/right shadow
        ctx.fillStyle = palette.wallDark;
        ctx.fillRect(x, y + s - b, s, b);
        ctx.fillRect(x + s - b, y, b, s);

        // Rachaduras nas paredes (usar dados pré-calculados)
        if (tileDecor && tileDecor.hasCrack) {
            this._drawCrack(ctx, x, y, s, palette.crack);
        }

        // Detritos ao redor de paredes (usar dados pré-calculados)
        if (tileDecor && tileDecor.hasDebris) {
            this._drawDebris(ctx, x, y, s, palette.debris);
        }
    }

    /** Fase 19: escada/saída na célula (EXIT_COL, EXIT_ROW) */
    _drawExitTile(ctx, x, y, palette) {
        const s = TILE_SIZE;
        const stepH = 10;
        const stepCount = 4;
        // Degraus descendo do topo (conectando à parede acima)
        for (let i = 0; i < stepCount; i++) {
            const stepY = y + 4 + i * stepH;
            const stepW = s - 8 - i * 6;
            const stepX = x + 4 + (i * 3);
            // Face do degrau (sombra)
            ctx.fillStyle = palette.wallDark || '#2a2a1a';
            ctx.fillRect(stepX, stepY + 2, stepW, stepH - 2);
            // Topo do degrau (destaque)
            ctx.fillStyle = palette.wallLight || '#6a5a4a';
            ctx.fillRect(stepX, stepY, stepW, 2);
        }
    }

    /** Fase 19: parede com abertura/topo da escada em (EXIT_COL, 0) */
    _drawExitWallTile(ctx, x, y, palette) {
        const s = TILE_SIZE;
        const b = 4;
        // Face principal da parede
        ctx.fillStyle = palette.wall;
        ctx.fillRect(x, y, s, s);
        // Destaque topo/esquerda
        ctx.fillStyle = palette.wallLight;
        ctx.fillRect(x, y, s, b);
        ctx.fillRect(x, y, b, s);
        // Sombra direita
        ctx.fillStyle = palette.wallDark;
        ctx.fillRect(x + s - b, y, b, s);
        // Abertura na metade inferior (topo da escada)
        ctx.fillStyle = palette.wallDark || '#1a1a12';
        ctx.fillRect(x + 4, y + s * 0.45, s - 8, s * 0.55 - 4);
        // Linhas dos degraus na base da abertura (conectam visualmente à tile abaixo)
        ctx.fillStyle = palette.wall;
        ctx.fillRect(x + 6, y + s - 14, s - 12, 2);
        ctx.fillRect(x + 8, y + s - 10, s - 16, 2);
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

    _drawDebrisTile(ctx, x, y, size, palette, col, row) {
        // Desenhar como caixa simples apocalíptica
        const b = 3; // border size
        
        // Corpo da caixa (cor baseada no tema)
        ctx.fillStyle = palette.debris || '#6a5a4a';
        ctx.fillRect(x, y, size, size);

        // Highlight superior/esquerdo
        ctx.fillStyle = palette.wallLight || '#7a6a5a';
        ctx.fillRect(x, y, size, b);
        ctx.fillRect(x, y, b, size);

        // Sombra inferior/direita
        ctx.fillStyle = palette.wallDark || '#4a3a2a';
        ctx.fillRect(x, y + size - b, size, b);
        ctx.fillRect(x + size - b, y, b, size);

        // Linha horizontal no meio (detalhe de caixa)
        ctx.fillStyle = palette.wallDark || '#4a3a2a';
        ctx.fillRect(x + b, y + Math.floor(size / 2) - 1, size - b * 2, 2);
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

        // Pontos de luz (lanternas, fogueiras) - usar posições armazenadas
        if (this.lightSources) {
            for (const light of this.lightSources) {
                this._drawLightSource(ctx, light.x * tileSize, light.y * tileSize, tileSize);
            }
        }
    }

    _generateLightSources(width, height) {
        // Gerar 3-5 fontes de luz baseadas em seed
        const count = this.prng.int(3, 6);
        const sources = [];
        for (let i = 0; i < count; i++) {
            sources.push({
                x: this.prng.int(2, width - 2),
                y: this.prng.int(2, height - 2)
            });
        }
        return sources;
    }

    _generateDecorativeTiles(width, height) {
        // Pré-calcular quais tiles terão elementos decorativos
        const decorativeTiles = {};
        
        for (let r = 0; r < height; r++) {
            for (let c = 0; c < width; c++) {
                const tileKey = `${c},${r}`;
                const decor = {};
                
                // Sujeira no chão (30% de chance)
                if (this.prng.random() > 0.7) {
                    decor.hasDirt = true;
                }
                
                // Manchas de sangue (5% de chance)
                if (this.prng.random() > 0.95) {
                    decor.hasBlood = true;
                }
                
                // Rachaduras nas paredes (40% de chance)
                if (this.prng.random() > 0.6) {
                    decor.hasCrack = true;
                }
                
                // Detritos ao redor de paredes (20% de chance)
                if (this.prng.random() > 0.8) {
                    decor.hasDebris = true;
                }
                
                // Só adicionar se tiver pelo menos um elemento decorativo
                if (Object.keys(decor).length > 0) {
                    decorativeTiles[tileKey] = decor;
                }
            }
        }
        
        return decorativeTiles;
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

    // Métodos legados mantidos para compatibilidade
    _drawWall(ctx, x, y) {
        const s = TILE_SIZE;
        const b = 4;
        ctx.fillStyle = COLOR_WALL;
        ctx.fillRect(x, y, s, s);
        ctx.fillStyle = COLOR_WALL_LIGHT;
        ctx.fillRect(x, y, s, b);
        ctx.fillRect(x, y, b, s);
        ctx.fillStyle = COLOR_WALL_DARK;
        ctx.fillRect(x, y + s - b, s, b);
        ctx.fillRect(x + s - b, y, b, s);
    }

    _drawBrick(ctx, x, y) {
        const s = TILE_SIZE;
        const b = 3;
        ctx.fillStyle = COLOR_BRICK;
        ctx.fillRect(x, y, s, s);
        ctx.fillStyle = COLOR_BRICK_LIGHT;
        ctx.fillRect(x, y, s, b);
        ctx.fillRect(x, y, b, s);
        ctx.fillStyle = COLOR_BRICK_DARK;
        ctx.fillRect(x, y + s - b, s, b);
        ctx.fillRect(x + s - b, y, b, s);
        ctx.fillStyle = COLOR_BRICK_DARK;
        ctx.fillRect(x + b, y + Math.floor(s / 2) - 1, s - b * 2, 2);
        ctx.fillRect(x + Math.floor(s / 2) - 1, y + b, 2, Math.floor(s / 2) - b - 1);
        ctx.fillRect(x + Math.floor(s / 4), y + Math.floor(s / 2) + 1, 2, Math.floor(s / 2) - b - 1);
    }

    draw(destCtx) {
        destCtx.drawImage(this.canvas, 0, HUD_HEIGHT);
    }
}
