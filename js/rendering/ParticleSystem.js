export default class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += p.gravity * dt;
            p.alpha = p.life / p.maxLife;
            p.size *= 0.99;
        }
    }

    draw(ctx) {
        for (const p of this.particles) {
            ctx.globalAlpha = p.alpha;

            if (p.text) {
                // Desenhar texto flutuante
                ctx.fillStyle = p.color;
                ctx.font = `bold ${p.size}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(p.text, p.x, p.y);
            } else {
                // Desenhar partícula normal
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
            }
        }
        ctx.globalAlpha = 1;
    }

    emitExplosion(x, y) {
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 150;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                gravity: 100,
                size: 3 + Math.random() * 5,
                life: 0.3 + Math.random() * 0.5,
                maxLife: 0.8,
                alpha: 1,
                color: ['#ff4400', '#ff8800', '#ffcc00', '#ffff88'][Math.floor(Math.random() * 4)],
            });
        }
    }

    emitBrickDestroy(x, y) {
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 30 + Math.random() * 80;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 40,
                gravity: 200,
                size: 3 + Math.random() * 4,
                life: 0.3 + Math.random() * 0.4,
                maxLife: 0.7,
                alpha: 1,
                color: ['#b07040', '#c88858', '#8a5530'][Math.floor(Math.random() * 3)],
            });
        }
    }

    emitDeath(x, y) {
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 60 + Math.random() * 120;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 50,
                gravity: 150,
                size: 2 + Math.random() * 6,
                life: 0.5 + Math.random() * 0.5,
                maxLife: 1.0,
                alpha: 1,
                color: ['#3388ff', '#5599ff', '#fff', '#88bbff'][Math.floor(Math.random() * 4)],
            });
        }
    }

    emitPowerUp(x, y, color) {
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 40 + Math.random() * 60;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 60,
                gravity: 50,
                size: 2 + Math.random() * 3,
                life: 0.3 + Math.random() * 0.4,
                maxLife: 0.7,
                alpha: 1,
                color: color || '#ffff00',
            });
        }
    }

    emitDamage(x, y, amount) {
        // Red particles for damage
        for (let i = 0; i < Math.min(15, amount); i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 100;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 40,
                gravity: 120,
                size: 2 + Math.random() * 4,
                life: 0.3 + Math.random() * 0.3,
                maxLife: 0.6,
                alpha: 1,
                color: '#f44',
            });
        }
    }

    emitLevelUp(x, y) {
        // Explosão dourada de level up
        for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 80 + Math.random() * 120;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 80,
                gravity: 80,
                size: 3 + Math.random() * 5,
                life: 0.5 + Math.random() * 0.5,
                maxLife: 1.0,
                alpha: 1,
                color: ['#ff0', '#fa0', '#ffff88', '#fff'][Math.floor(Math.random() * 4)],
            });
        }
    }

    emitXPGain(x, y, amount) {
        // Floating text de XP
        this.particles.push({
            x, y,
            vx: 0,
            vy: -30, // Sobe devagar
            gravity: 0,
            size: 14,
            life: 1.5,
            maxLife: 1.5,
            alpha: 1,
            color: '#4af',
            text: `+${amount} XP`, // ← Novo: partícula com texto
        });
    }

    emitPhysicalAttack(x, y, direction, hit) {
        const count = hit ? 8 : 4; // Mais partículas se acertou
        const color = hit ? '#ff4444' : '#888888';
        
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = hit ? 40 + Math.random() * 20 : 20 + Math.random() * 10;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                gravity: 0,
                life: 0.3,
                maxLife: 0.3,
                alpha: 1,
                color: color,
                size: 3 + Math.random() * 2
            });
        }
    }

    clear() {
        this.particles = [];
    }
}
