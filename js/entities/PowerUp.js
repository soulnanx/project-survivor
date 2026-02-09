import Entity from './Entity.js';

export default class PowerUp extends Entity {
    constructor(x, y, powerType) {
        super(x, y);
        this.type = 'powerup';
        this.powerType = powerType; // 'bomb', 'flame', 'speed'
        this.bobTimer = 0;
    }

    update(dt, context) {
        this.bobTimer += dt;
    }
}
