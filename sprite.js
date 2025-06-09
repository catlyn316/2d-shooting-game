class Sprite {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.speed = 8; // 提高基礎速度
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Player extends Sprite {
    constructor(x, y) {
        super(x, y, 40, 40, '#00ff00');
        this.bullets = [];
        this.hp = 100;
        this.isInvincible = false;
        this.invincibleTime = 1000; // 無敵時間（毫秒）
        this.angle = 0; // 射擊角度
    }

    shoot() {
        const bulletX = this.x + this.width / 2;
        const bulletY = this.y + this.height / 2;
        const bullet = new Bullet(
            bulletX,
            bulletY,
            '#ffff00',
            this.angle
        );
        this.bullets.push(bullet);
    }

    takeDamage(amount) {
        if (!this.isInvincible) {
            this.hp = Math.max(0, this.hp - amount);
            this.isInvincible = true;
            setTimeout(() => {
                this.isInvincible = false;
            }, this.invincibleTime);
        }
    }

    update() {
        this.bullets = this.bullets.filter(bullet => bullet.isActive);
        this.bullets.forEach(bullet => bullet.update());
    }

    draw(ctx) {
        ctx.save();
        // 如果處於無敵狀態，則閃爍效果
        if (this.isInvincible && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        super.draw(ctx);
        ctx.restore();
        
        this.bullets.forEach(bullet => bullet.draw(ctx));
    }
}

class Enemy extends Sprite {
    constructor(x, y) {
        super(x, y, 30, 30, '#ff0000');
        this.speed = 3;
        this.speedX = 0;
        this.speedY = 0;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
    }
}

class Bullet extends Sprite {
    constructor(x, y, color, angle) {
        super(x, y, 5, 5, color);
        this.speed = 15;
        this.isActive = true;
        this.angle = angle;
    }

    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        
        // 如果子彈超出畫面範圍則移除
        if (this.x < -50 || this.x > 850 || 
            this.y < -50 || this.y > 650) {
            this.isActive = false;
        }
    }
}