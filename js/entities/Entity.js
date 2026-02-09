export default class Entity {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.alive = true;
        this.type = 'entity';
        this.behavior = null;
    }

    update(dt, context) {
        if (this.behavior) {
            this.behavior.update(this, dt, context);
        }
    }

    onCollision(other) {
        if (this.behavior) {
            this.behavior.onCollision(this, other);
        }
    }

    kill() {
        this.alive = false;
    }
}
