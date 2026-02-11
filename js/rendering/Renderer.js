import {
    CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, HUD_HEIGHT,
    STATE_INTRO, STATE_MENU, STATE_HUB, STATE_PLAYING, STATE_PAUSED, STATE_GAME_OVER,
    STATE_LEVEL_COMPLETE, STATE_SEED_INPUT
} from '../constants.js';
import {
    POI_TYPE_INVENTORY,
    POI_TYPE_SHOP,
    POI_TYPE_DUNGEON,
    POI_TYPE_HIGH_SCORES,
} from '../constants.js';
import { gridToPixelX, gridToPixelY } from '../utils.js';
import BackgroundLayer from './BackgroundLayer.js';
import EntityRenderer from './EntityRenderer.js';
import ParticleSystem from './ParticleSystem.js';
import UIRenderer from './UIRenderer.js';
import EventBus from '../core/EventBus.js';

export default class Renderer {
    constructor(ctx, canvas) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.backgroundLayer = new BackgroundLayer();
        this.entityRenderer = new EntityRenderer();
        this.particleSystem = new ParticleSystem();
        this.uiRenderer = new UIRenderer();

        this._setupParticleEvents();
    }

    _setupParticleEvents() {
        EventBus.on('bomb:detonated', ({ cells }) => {
            for (const cell of cells) {
                this.particleSystem.emitExplosion(gridToPixelX(cell.col), gridToPixelY(cell.row));
            }
        });

        EventBus.on('brick:destroyed', ({ col, row }) => {
            this.particleSystem.emitBrickDestroy(gridToPixelX(col), gridToPixelY(row));
        });

        EventBus.on('powerup:collected', ({ player }) => {
            if (player) {
                this.particleSystem.emitPowerUp(player.x, player.y, '#ffff00');
            }
        });

        EventBus.on('enemy:killed', ({ enemy }) => {
            if (enemy) {
                this.particleSystem.emitExplosion(enemy.x, enemy.y);
            }
        });
    }

    render(renderContext) {
        const ctx = this.ctx;
        const { state } = renderContext;

        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        if (state === STATE_INTRO) {
            this.uiRenderer.drawIntro(ctx, renderContext);
            return;
        }

        if (state === STATE_MENU) {
            this.uiRenderer.drawMenu(ctx, renderContext);
            return;
        }

        if (state === STATE_HUB) {
            this.backgroundLayer.draw(ctx);
            this._drawHubStructures(ctx, renderContext.hubDecorations);
            this._drawHubPOIMarkers(ctx, renderContext.hubPOIs);
            this._drawEntities(ctx, renderContext);
            this.uiRenderer.drawHub(ctx, renderContext);
            return;
        }

        if (state === STATE_SEED_INPUT) {
            this.uiRenderer.drawSeedInput(ctx, renderContext);
            return;
        }

        // Draw game world
        this.backgroundLayer.draw(ctx);
        this._drawEntities(ctx, renderContext);
        this.particleSystem.draw(ctx);
        this.uiRenderer.drawHUD(ctx, renderContext);

        // Overlays
        switch (state) {
            case STATE_PAUSED:
                this.uiRenderer.drawPause(ctx);
                break;
            case STATE_GAME_OVER:
                this.uiRenderer.drawGameOver(ctx, renderContext);
                break;
            case STATE_LEVEL_COMPLETE:
                this.uiRenderer.drawLevelComplete(ctx, renderContext);
                break;
        }
    }

    /**
     * Desenha estruturas visuais do HUB (Fase 26): escada, balcão, etc.
     * Usa placeholders (retângulos/formas) quando não há sprite; não altera o grid.
     */
    _drawHubStructures(ctx, hubDecorations) {
        if (!hubDecorations || hubDecorations.length === 0) return;

        const pad = TILE_SIZE * 0.1;
        const w = TILE_SIZE - pad * 2;
        const h = TILE_SIZE - pad * 2;

        for (const dec of hubDecorations) {
            const x = gridToPixelX(dec.col) - TILE_SIZE / 2 + pad;
            const y = gridToPixelY(dec.row) - TILE_SIZE / 2 + pad;

            switch (dec.type) {
                case POI_TYPE_DUNGEON: {
                    // Placeholder: escada (degraus descendo)
                    const stepH = h / 4;
                    ctx.fillStyle = '#5a4a3a';
                    ctx.strokeStyle = '#3a2a1a';
                    ctx.lineWidth = 2;
                    for (let i = 0; i < 4; i++) {
                        const sy = y + i * stepH;
                        const sw = w * (1 - i * 0.15);
                        const sx = x + (w - sw) / 2;
                        ctx.fillRect(sx, sy, sw, stepH);
                        ctx.strokeRect(sx, sy, sw, stepH);
                    }
                    ctx.fillStyle = '#2a1a0a';
                    ctx.fillRect(x + w * 0.3, y + h * 0.5, w * 0.4, h * 0.2);
                    break;
                }
                case POI_TYPE_SHOP: {
                    // Placeholder: balcão (retângulo horizontal)
                    ctx.fillStyle = '#8a7a5a';
                    ctx.strokeStyle = '#5a4a3a';
                    ctx.lineWidth = 2;
                    ctx.fillRect(x, y + h * 0.3, w, h * 0.5);
                    ctx.strokeRect(x, y + h * 0.3, w, h * 0.5);
                    ctx.fillStyle = '#e8c040';
                    ctx.font = 'bold 14px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('$', x + w / 2, y + h * 0.55);
                    break;
                }
                case POI_TYPE_INVENTORY:
                case POI_TYPE_HIGH_SCORES:
                default: {
                    // Placeholder: retângulo colorido por tipo (polish posterior)
                    const color = dec.type === POI_TYPE_INVENTORY ? 'rgba(60,80,120,0.6)' : 'rgba(90,75,40,0.6)';
                    ctx.fillStyle = color;
                    ctx.strokeStyle = dec.type === POI_TYPE_INVENTORY ? '#6b8cce' : '#c9a227';
                    ctx.lineWidth = 2;
                    ctx.fillRect(x, y, w, h);
                    ctx.strokeRect(x, y, w, h);
                    break;
                }
            }
        }
    }

    /**
     * Desenha indicadores visuais nos POIs do HUB (Fase 23).
     * Cada tipo tem uma placa/ícone no chão para o jogador identificar onde interagir.
     */
    _drawHubPOIMarkers(ctx, hubPOIs) {
        if (!hubPOIs || hubPOIs.length === 0) return;

        const size = TILE_SIZE * 0.5; // metade da tile
        const labels = {
            [POI_TYPE_INVENTORY]: { text: 'I', desc: 'Inventário', color: '#6b8cce', bg: 'rgba(60,80,120,0.85)' },
            [POI_TYPE_SHOP]: { text: '$', desc: 'Loja', color: '#e8c040', bg: 'rgba(120,90,40,0.85)' },
            [POI_TYPE_DUNGEON]: { text: '↓', desc: 'Dungeon', color: '#c45a4a', bg: 'rgba(100,50,45,0.85)' },
            [POI_TYPE_HIGH_SCORES]: { text: '★', desc: 'Recordes', color: '#c9a227', bg: 'rgba(90,75,40,0.85)' },
        };

        for (const poi of hubPOIs) {
            const x = gridToPixelX(poi.col);
            const y = gridToPixelY(poi.row);
            const cfg = labels[poi.type] || { text: '?', desc: '', color: '#888', bg: 'rgba(50,50,50,0.85)' };

            // Placa no chão (retângulo arredondado)
            const w = size;
            const h = size * 0.7;
            const rx = 6;
            ctx.fillStyle = cfg.bg;
            ctx.strokeStyle = cfg.color;
            ctx.lineWidth = 2;
            roundRect(ctx, x - w / 2, y - h / 2 - 4, w, h, rx);
            ctx.fill();
            ctx.stroke();

            // Ícone/símbolo
            ctx.fillStyle = cfg.color;
            ctx.font = 'bold 22px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(cfg.text, x, y - 4);

            // Etiqueta abaixo da placa (nome do local)
            ctx.fillStyle = '#e8e0d0';
            ctx.font = '11px sans-serif';
            ctx.fillText(cfg.desc, x, y + h / 2 + 6);
        }

        function roundRect(ctx, x, y, w, h, r) {
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + h - r);
            ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            ctx.lineTo(x + r, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
        }
    }

    _drawEntities(ctx, { entityManager, goldDrops }) {
        if (!entityManager) return;

        // Drops de ouro (Fase 20) — desenhar antes de entidades para ficarem no chão
        if (goldDrops && goldDrops.length > 0) {
            for (const drop of goldDrops) {
                this.entityRenderer.drawGoldDrop(ctx, drop);
            }
        }

        // Draw in order: powerups, bombs, explosions, enemies, player
        for (const pu of entityManager.getLayer('powerups')) {
            this.entityRenderer.drawPowerUp(ctx, pu);
        }
        for (const bomb of entityManager.getLayer('bombs')) {
            this.entityRenderer.drawBomb(ctx, bomb);
        }
        for (const exp of entityManager.getLayer('explosions')) {
            this.entityRenderer.drawExplosion(ctx, exp);
        }
        for (const enemy of entityManager.getLayer('enemies')) {
            this.entityRenderer.drawEnemy(ctx, enemy);
        }
        for (const player of entityManager.getLayer('player')) {
            this.entityRenderer.drawPlayer(ctx, player);
        }
    }
}
