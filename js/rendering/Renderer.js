import {
    CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, HUD_HEIGHT,
    STATE_INTRO, STATE_MENU, STATE_HUB, STATE_PLAYING, STATE_PAUSED, STATE_GAME_OVER,
    STATE_LEVEL_COMPLETE, STATE_SEED_INPUT
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

    _drawEntities(ctx, { entityManager }) {
        if (!entityManager) return;

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
