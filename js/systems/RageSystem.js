import EventBus from '../core/EventBus.js';
import { pixelToGridCol, pixelToGridRow, dist } from '../utils.js';
import {
    RAGE_DURATION_MOVEMENT_MIN,
    RAGE_DURATION_MOVEMENT_MAX,
    RAGE_DURATION_PAUSE,
    RAGE_DURATION_DISTANCE_FACTOR,
    RAGE_TIME_MULTIPLIERS,
    RAGE_IMMEDIATE_PAUSE_DISTANCE
} from '../constants.js';

/**
 * Rage System
 * 
 * Manages rage state of zombies when bombs explode.
 * Each zombie enters rage mode, moves faster toward explosion site,
 * pauses when arriving, then returns to normal.
 */
export default class RageSystem {
    constructor() {
        this.activeRages = new Map(); // Map<enemyId, rageData>
        this._setupEvents();
    }

    _setupEvents() {
        EventBus.on('bomb:detonated', ({ bomb, cells }) => {
            this._handleBombDetonation(bomb, cells);
        });
    }

    /**
     * Handle bomb detonation - trigger rage for all enemies
     * @param {Object} bomb - The bomb that exploded
     * @param {Array} cells - Array of {col, row} cells affected by explosion
     */
    _handleBombDetonation(bomb, cells) {
        const explosionCol = pixelToGridCol(bomb.x);
        const explosionRow = pixelToGridRow(bomb.y);
        
        // Emit event so enemies can react
        EventBus.emit('rage:triggered', {
            explosionCol,
            explosionRow,
            cells,
            bomb
        });
    }

    /**
     * Calculate dynamic rage duration based on distance and zombie type
     * @param {number} zombieCol - Zombie's grid column
     * @param {number} zombieRow - Zombie's grid row
     * @param {number} explosionCol - Explosion's grid column
     * @param {number} explosionRow - Explosion's grid row
     * @param {string} zombieType - Type of zombie ('wanderer', 'chaser', 'smart')
     * @returns {number} Duration in seconds
     */
    calculateRageDuration(zombieCol, zombieRow, explosionCol, explosionRow, zombieType) {
        // Calculate Manhattan distance
        const distance = Math.abs(zombieCol - explosionCol) + Math.abs(zombieRow - explosionRow);
        
        // If zombie is already at location, return pause duration only
        if (distance < RAGE_IMMEDIATE_PAUSE_DISTANCE) {
            return RAGE_DURATION_PAUSE;
        }
        
        // Calculate base time based on distance
        const baseTime = Math.min(
            RAGE_DURATION_MOVEMENT_MAX,
            Math.max(RAGE_DURATION_MOVEMENT_MIN, distance * RAGE_DURATION_DISTANCE_FACTOR)
        );
        
        // Apply type multiplier
        const multiplier = RAGE_TIME_MULTIPLIERS[zombieType] || 1.0;
        const adjustedTime = baseTime * multiplier;
        
        // Total duration = movement time + pause time
        return adjustedTime + RAGE_DURATION_PAUSE;
    }

    /**
     * Check if a zombie has reached the explosion target
     * @param {number} zombieCol - Zombie's grid column
     * @param {number} zombieRow - Zombie's grid row
     * @param {number} explosionCol - Explosion's grid column
     * @param {number} explosionRow - Explosion's grid row
     * @param {Array} explosionCells - Array of cells affected by explosion
     * @returns {boolean} True if zombie has reached the target
     */
    hasReachedTarget(zombieCol, zombieRow, explosionCol, explosionRow, explosionCells) {
        // Option 1: Check if within 1 tile of center
        const distance = Math.abs(zombieCol - explosionCol) + Math.abs(zombieRow - explosionRow);
        if (distance <= 1) return true;
        
        // Option 2: Check if zombie is in any explosion cell
        return explosionCells.some(cell => 
            cell.col === zombieCol && cell.row === zombieRow
        );
    }

    /**
     * Update rage system (called from Game.update)
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
        // Rage state is managed by individual Enemy instances
        // This system mainly provides helper methods
    }
}
