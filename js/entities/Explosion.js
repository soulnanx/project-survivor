import Entity from './Entity.js';
import { EXPLOSION_DURATION } from '../constants.js';

export default class Explosion extends Entity {
    constructor(x, y, cells) {
        super(x, y);
        this.type = 'explosion';
        this.cells = cells; // Array of {col, row} affected cells
        this.timer = EXPLOSION_DURATION;
        this.duration = EXPLOSION_DURATION;
    }

    update(dt, context) {
        this.timer -= dt;
        if (this.timer <= 0) {
            this.alive = false;
        }
    }

    get progress() {
        return 1 - (this.timer / this.duration);
    }
}
