import EventBus from '../core/EventBus.js';
import { pixelToGridCol, pixelToGridRow, dist } from '../utils.js';

/**
 * Attraction System
 *
 * Manages attraction of zombies to bomb detonation sites.
 * When a bomb explodes, all zombies are attracted to that location for 10 seconds,
 * then return to their normal behavior.
 */
export default class AttractionSystem {
    constructor() {
        this.attractions = []; // Array of {col, row, timer}
        this._setupEvents();
    }

    _setupEvents() {
        EventBus.on('bomb:detonated', ({ bomb }) => {
            const col = pixelToGridCol(bomb.x);
            const row = pixelToGridRow(bomb.y);
            this.attractions.push({ col, row, timer: 10.0 });
        });
    }

    /**
     * Update attraction timers and remove expired attractions
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
        // Decrement timers
        this.attractions = this.attractions.map(a => ({
            ...a,
            timer: a.timer - dt
        }));

        // Remove expired attractions
        this.attractions = this.attractions.filter(a => a.timer > 0);
    }

    /**
     * Get the nearest attraction to the given position
     * @param {number} entityCol - Entity's grid column
     * @param {number} entityRow - Entity's grid row
     * @returns {Object|null} - Nearest attraction {col, row, timer} or null if none active
     */
    getAttractionTarget(entityCol, entityRow) {
        if (this.attractions.length === 0) return null;

        // Find nearest attraction using Manhattan/Euclidean distance
        let nearest = this.attractions[0];
        let minDist = dist(entityCol, entityRow, nearest.col, nearest.row);

        for (let i = 1; i < this.attractions.length; i++) {
            const d = dist(entityCol, entityRow,
                          this.attractions[i].col,
                          this.attractions[i].row);
            if (d < minDist) {
                minDist = d;
                nearest = this.attractions[i];
            }
        }

        return nearest;
    }
}
