class Sprite {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.speed = 8; // 提高基礎速度
    }

    draw(ctx, player) {
        // 預設不繪製，交由子類別覆寫
    }
}

class Player extends Sprite {
    constructor(x, y) {
        super(x, y, 40, 40, '#00aaff');
        this.bullets = [];
        this.hp = 100;
        this.maxHp = 100;
        this.isInvincible = false;
        this.invincibleTime = 1000;
        this.angle = 0;
        this.missileCooldown = 0; // 導彈冷卻剩餘時間（毫秒）
        this.missileCooldownMax = 10000; // 10秒
        this.missiles = [];
        this.shootAudio = new Audio('shoot.wav.mp3');
        this.shootAudio.volume = 0.175;
        this.missileHitAudio = new Audio('missile_hit.wav.mp3');
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
        this.shootAudio.currentTime = 0;
        this.shootAudio.play();
    }

    shootMissile() {
        if (this.missileCooldown <= 0) {
            const missileX = this.x + this.width / 2;
            const missileY = this.y + this.height / 2;
            const missile = new Missile(missileX, missileY, this.angle);
            this.missiles.push(missile);
            this.missileCooldown = this.missileCooldownMax;
        }
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
        this.missiles = this.missiles.filter(missile => missile.isActive);
        this.missiles.forEach(missile => missile.update());
        if (this.missileCooldown > 0) {
            this.missileCooldown -= 16; // 約等於一幀
            if (this.missileCooldown < 0) this.missileCooldown = 0;
        }
    }

    draw(ctx) {
        ctx.save();
        // 閃爍效果
        if (this.isInvincible && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        // 以圓形繪製主角
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        ctx.translate(cx, cy);
        ctx.rotate(this.angle);
        // 主體
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
        // 槍（右手）
        ctx.save();
        ctx.rotate(0.1); // 稍微偏右
        ctx.fillStyle = '#444';
        ctx.fillRect(10, -4, 18, 8); // 槍身
        ctx.fillStyle = '#222';
        ctx.fillRect(24, -2, 8, 4); // 槍口
        ctx.restore();
        // 眼睛
        ctx.beginPath();
        ctx.arc(10, -7, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.closePath();
        ctx.restore();
        
        // 子彈
        this.bullets.forEach(bullet => bullet.draw(ctx));
        this.missiles.forEach(missile => missile.draw(ctx));
    }
}

class Missile extends Sprite {
    constructor(x, y, angle) {
        super(x, y, 18, 18, '#ff8800');
        this.angle = angle;
        this.speed = 9;
        this.isActive = true;
        this.lifeTime = 2000;
        setTimeout(() => this.isActive = false, this.lifeTime);
    }
    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.beginPath();
        ctx.moveTo(-6, -6);
        ctx.lineTo(12, 0);
        ctx.lineTo(-6, 6);
        ctx.closePath();
        ctx.fillStyle = '#ff8800';
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.restore();
    }
}

class Enemy extends Sprite {
    constructor(x, y) {
        super(x, y, 30, 30, '#ff3333');
        this.speed = 3;
        this.speedX = 0;
        this.speedY = 0;
        this.angle = 0; // 新增：朝向主角的角度
    }

    update(player) {
        // 追蹤玩家並記錄角度
        const dx = player.x + player.width / 2 - (this.x + this.width / 2);
        const dy = player.y + player.height / 2 - (this.y + this.height / 2);
        this.angle = Math.atan2(dy, dx);
        this.speedX = Math.cos(this.angle) * this.speed;
        this.speedY = Math.sin(this.angle) * this.speed;
        this.x += this.speedX;
        this.y += this.speedY;
    }

    draw(ctx, player) {
        ctx.save();
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        ctx.translate(cx, cy);
        // 旋轉面向主角
        let angle = this.angle;
        if (typeof angle !== 'number') angle = 0;
        ctx.rotate(angle);
        // 主體
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
        // 刀（右手）
        ctx.save();
        ctx.rotate(0.5); // 右手方向
        ctx.fillStyle = '#888';
        ctx.fillRect(10, -3, 14, 6);
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(24, -6);
        ctx.lineTo(28, 0);
        ctx.lineTo(24, 6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        // 眼睛
        ctx.beginPath();
        ctx.arc(7, -5, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }
}

class Boss extends Sprite {
    constructor(x, y) {
        super(x, y, 80, 80, '#8000ff');
        this.hp = 450; // 1.5倍原本血量（原本300）
        this.maxHp = 450;
        this.speed = 2.5;
        this.angle = 0;
    }
    update(player) {
        // 追蹤玩家
        const dx = player.x + player.width / 2 - (this.x + this.width / 2);
        const dy = player.y + player.height / 2 - (this.y + this.height / 2);
        this.angle = Math.atan2(dy, dx);
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
    }
    draw(ctx, player) {
        ctx.save();
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        ctx.translate(cx, cy);
        ctx.rotate(this.angle);
        // 主體
        ctx.beginPath();
        ctx.arc(0, 0, 40, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 20;
        ctx.fill();
        ctx.closePath();
        // 雙手大刀
        ctx.save();
        ctx.rotate(0.5);
        ctx.fillStyle = '#aaa';
        ctx.fillRect(30, -8, 30, 16);
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(60, -16);
        ctx.lineTo(70, 0);
        ctx.lineTo(60, 16);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        // 眼睛
        ctx.beginPath();
        ctx.arc(20, -15, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#ff0';
        ctx.fill();
        ctx.closePath();
        ctx.restore();
        // 血條（頭上）
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); // 重設 transform
        const barW = 120, barH = 14;
        const barX = this.x + this.width / 2 - barW / 2;
        const barY = this.y - 28;
        ctx.fillStyle = '#222';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = '#f00';
        ctx.fillRect(barX, barY, barW * (this.hp / this.maxHp), barH);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barW, barH);
        ctx.restore();
    }
}

class Bullet extends Sprite {
    constructor(x, y, color, angle) {
        super(x, y, 10, 10, color);
        this.angle = angle;
        this.speed = 12; // 增加子彈速度
        this.isActive = true;
        this.lifeTime = 1000; // 子彈存在時間（毫秒）
        setTimeout(() => this.isActive = false, this.lifeTime);
    }

    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }
}