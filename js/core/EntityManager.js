import { pixelToGridCol, pixelToGridRow } from '../utils.js';

export default class EntityManager {
    constructor() {
        this.layers = {};
        this.layerOrder = ['powerups', 'bombs', 'explosions', 'enemies', 'player', 'particles'];
    }

    add(entity, layer) {
        if (!this.layers[layer]) {
            this.layers[layer] = [];
        }
        this.layers[layer].push(entity);
    }

    update(dt, context) {
        for (const layer of this.layerOrder) {
            const entities = this.layers[layer];
            if (!entities) continue;
            for (const entity of entities) {
                if (entity.alive) {
                    entity.update(dt, context);
                }
            }
        }
        this.prune();
    }

    prune() {
        for (const layer in this.layers) {
            this.layers[layer] = this.layers[layer].filter(e => e.alive);
        }
    }

    getLayer(layer) {
        return this.layers[layer] || [];
    }

    getByType(type) {
        const results = [];
        for (const layer in this.layers) {
            for (const entity of this.layers[layer]) {
                if (entity.type === type && entity.alive) {
                    results.push(entity);
                }
            }
        }
        return results;
    }

    getAtCell(col, row) {
        const results = [];
        for (const layer in this.layers) {
            for (const entity of this.layers[layer]) {
                if (!entity.alive) continue;
                const ec = pixelToGridCol(entity.x);
                const er = pixelToGridRow(entity.y);
                if (ec === col && er === row) {
                    results.push(entity);
                }
            }
        }
        return results;
    }

    getAllEntities() {
        const results = [];
        for (const layer of this.layerOrder) {
            const entities = this.layers[layer];
            if (!entities) continue;
            for (const entity of entities) {
                if (entity.alive) results.push(entity);
            }
        }
        return results;
    }

    clear() {
        this.layers = {};
    }
}
