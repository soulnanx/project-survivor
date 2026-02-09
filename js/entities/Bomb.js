import Entity from './Entity.js';
import { BOMB_TIMER } from '../constants.js';

export default class Bomb extends Entity {
    constructor(x, y, range, owner) {
        super(x, y);
        this.type = 'bomb';
        this.range = range;
        this.owner = owner;
        this.timer = BOMB_TIMER;
        this.pulseTimer = 0;
    }

    update(dt, context) {
        this.timer -= dt;
        this.pulseTimer += dt;

        if (this.timer <= 0) {
            this.detonate(context);
        }
    }

    detonate(context) {
        if (!this.alive) return;
        this.alive = false;
        if (this.owner) {
            this.owner.activeBombs = Math.max(0, this.owner.activeBombs - 1);
        }
        context.bombSystem.detonate(this, context);
    }
}
