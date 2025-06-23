class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        this.player = new Player(
            this.canvas.width / 2 - 20,
            this.canvas.height / 2 - 20
        );
        
        this.enemies = [];
        this.healthItems = []; // 新增：儲存回血道具
        this.score = 0;
        this.gameLoop = this.gameLoop.bind(this);
        this.lastEnemySpawn = 0;
        this.enemySpawnInterval = 1000;
        
        this.keys = {
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false
        };
        
        this.mousePosition = { x: 0, y: 0 };
        this.isMouseDown = false;
        this.lastShot = 0;
        this.shootInterval = 150; // 連射間隔(毫秒)
        
        this.boss = null;
        this.killCount = 0;
        this.nextBossKill = this.getRandomBossKill();
        
        this.isVictory = false; // 新增：勝利旗標
        
        this.setupControls();
        this.gameLoop();
    }

    getRandomBossKill() {
        return Math.floor(Math.random() * 16) + 10; // 10~25
    }

    setupControls() {
        // 修改玩家控制方向為 WASD
        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'w':
                    this.keys.ArrowUp = true;
                    break;
                case 'a':
                    this.keys.ArrowLeft = true;
                    break;
                case 's':
                    this.keys.ArrowDown = true;
                    break;
                case 'd':
                    this.keys.ArrowRight = true;
                    break;
                case ' ': // 空白鍵發射導彈
                    e.preventDefault();
                    this.player.shootMissile();
                    break;
            }
        });

        document.addEventListener('keyup', (e) => {
            switch (e.key) {
                case 'w':
                    this.keys.ArrowUp = false;
                    break;
                case 'a':
                    this.keys.ArrowLeft = false;
                    break;
                case 's':
                    this.keys.ArrowDown = false;
                    break;
                case 'd':
                    this.keys.ArrowRight = false;
                    break;
            }
        });

        // 滑鼠移動事件
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mousePosition.x = e.clientX - rect.left;
            this.mousePosition.y = e.clientY - rect.top;
            
            // 更新玩家射擊角度
            const dx = this.mousePosition.x - (this.player.x + this.player.width/2);
            const dy = this.mousePosition.y - (this.player.y + this.player.height/2);
            this.player.angle = Math.atan2(dy, dx);
        });

        // 滑鼠按下事件
        this.canvas.addEventListener('mousedown', () => {
            this.isMouseDown = true;
        });

        // 滑鼠放開事件
        this.canvas.addEventListener('mouseup', () => {
            this.isMouseDown = false;
        });
    }

    updatePlayerMovement() {
        const speed = this.player.speed;
        if (this.keys.ArrowUp && this.player.y > 0) {
            this.player.y -= speed;
        }
        if (this.keys.ArrowDown && this.player.y < this.canvas.height - this.player.height) {
            this.player.y += speed;
        }
        if (this.keys.ArrowLeft && this.player.x > 0) {
            this.player.x -= speed;
        }
        if (this.keys.ArrowRight && this.player.x < this.canvas.width - this.player.width) {
            this.player.x += speed;
        }
    }

    handleShooting() {
        const now = Date.now();
        if (this.isMouseDown && now - this.lastShot > this.shootInterval) {
            this.player.shoot();
            this.lastShot = now;
        }
    }

    spawnEnemy() {
        if (this.boss) return; // Boss出現時不產生小怪
        const now = Date.now();
        if (now - this.lastEnemySpawn > this.enemySpawnInterval) {
            // 隨機選擇敵人生成位置（四周）
            let x, y;
            const side = Math.floor(Math.random() * 4);
            
            switch(side) {
                case 0: // 上方
                    x = Math.random() * this.canvas.width;
                    y = -30;
                    break;
                case 1: // 右方
                    x = this.canvas.width + 30;
                    y = Math.random() * this.canvas.height;
                    break;
                case 2: // 下方
                    x = Math.random() * this.canvas.width;
                    y = this.canvas.height + 30;
                    break;
                case 3: // 左方
                    x = -30;
                    y = Math.random() * this.canvas.height;
                    break;
            }
            
            const enemy = new Enemy(x, y);
            this.enemies.push(enemy);
            this.lastEnemySpawn = now;
        }
    }

    checkCollisions() {
        const now = Date.now();

        this.enemies = this.enemies.filter(enemy => {
            let isHit = false;
            this.player.bullets = this.player.bullets.filter(bullet => {
                if (this.checkCollision(bullet, enemy)) {
                    isHit = true;
                    this.score += 10;
                    document.getElementById('scoreValue').textContent = this.score;
                    this.killCount++;
                    // 5% 機率掉落回血道具
                    if (Math.random() < 0.05) {
                        this.spawnHealthItem(enemy.x, enemy.y);
                    }
                    return false;
                }
                return true;
            });
            if (this.checkCollision(enemy, this.player) && !this.player.isInvincible) {
                const damage = Math.floor(Math.random() * 5) + 1;
                this.player.takeDamage(damage);
                document.getElementById('hpValue').textContent = this.player.hp;
                return false;
            }
            if (enemy.x < -50 || enemy.x > this.canvas.width + 50 ||
                enemy.y < -50 || enemy.y > this.canvas.height + 50) {
                return false;
            }
            return !isHit;
        });
        // Boss碰撞
        if (this.boss) {
            this.player.bullets = this.player.bullets.filter(bullet => {
                if (this.checkCollision(bullet, this.boss)) {
                    this.boss.hp -= 10;
                    return false;
                }
                return true;
            });
            // 導彈擊中boss
            this.player.missiles = this.player.missiles.filter(missile => {
                if (this.checkCollision(missile, this.boss)) {
                    this.boss.hp -= 100; // 導彈傷害為子彈10倍
                    missile.isActive = false;
                    // 播放導彈命中音效
                    this.player.missileHitAudio.currentTime = 0;
                    this.player.missileHitAudio.play();
                    return false;
                }
                return true;
            });
            if (this.checkCollision(this.boss, this.player) && !this.player.isInvincible) {
                this.player.takeDamage(15);
                document.getElementById('hpValue').textContent = this.player.hp;
            }
            if (this.boss.hp <= 0) {
                this.boss = null;
                this.killCount = 0;
                this.nextBossKill = this.getRandomBossKill();
            }
        }
        // 檢測玩家與回血道具的碰撞
        this.healthItems = this.healthItems.filter(item => {
            if (this.checkCollision(item, this.player)) {
                this.player.hp = Math.min(this.player.hp + 10, this.player.maxHp); // 增加玩家生命值，且不超過最大值
                document.getElementById('hpValue').textContent = this.player.hp; // 更新生命值顯示
                return false; // 移除已被拾取的回血道具
            }
            return true;
        });
    }

    spawnHealthItem(x, y) {
        // 在指定位置生成回血道具
        this.healthItems.push({ x, y, width: 20, height: 20, color: 'green' });
    }

    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    update() {
        this.updatePlayerMovement();
        this.handleShooting();
        if (!this.boss && this.killCount >= this.nextBossKill) {
            this.boss = new Boss(
                Math.random() * (this.canvas.width - 100) + 50,
                Math.random() * (this.canvas.height - 100) + 50
            );
        }
        this.spawnEnemy();
        this.player.update();
        if (this.boss) {
            this.boss.update(this.player);
        }
        this.enemies.forEach(enemy => enemy.update(this.player));
        this.checkCollisions();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.player.draw(this.ctx);
        if (this.boss) {
            this.boss.draw(this.ctx, this.player);
        }
        this.enemies.forEach(enemy => enemy.draw(this.ctx, this.player));
        this.healthItems.forEach(item => {
            this.ctx.fillStyle = item.color;
            this.ctx.fillRect(item.x, item.y, item.width, item.height);
        });
        // 導彈冷卻條
        this.drawMissileCooldownBar();
    }

    drawMissileCooldownBar() {
        const barW = 240, barH = 18;
        const x = (this.canvas.width - barW) / 2;
        const y = this.canvas.height - barH - 18;
        const cd = this.player.missileCooldown;
        const cdMax = this.player.missileCooldownMax;
        this.ctx.save();
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(x, y, barW, barH);
        this.ctx.fillStyle = cd === 0 ? '#0f0' : '#ff8800';
        this.ctx.fillRect(x, y, barW * (1 - cd / cdMax), barH);
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, barW, barH);
        this.ctx.font = '16px Arial';
        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        if (cd === 0) {
            this.ctx.fillText('導彈已就緒 (空白鍵)', x + barW / 2, y + barH / 2);
        } else {
            this.ctx.fillText('導彈冷卻中 ' + (cd / 1000).toFixed(1) + ' 秒', x + barW / 2, y + barH / 2);
        }
        this.ctx.restore();
    }

    gameLoop() {
        if (this.player.hp <= 0) {
            this.displayGameOver();
            return;
        }
        if (this.isVictory) return; // 勝利時停止遊戲迴圈
        this.update();
        this.draw();
        requestAnimationFrame(this.gameLoop);
    }

    displayGameOver() {
        const ctx = this.ctx;
        ctx.fillStyle = 'red';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', this.canvas.width / 2, this.canvas.height / 2);
    }

    displayVictory() {
        this.isVictory = true;
        const ctx = this.ctx;
        ctx.save();
        ctx.fillStyle = '#0f0';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('遊戲勝利！', this.canvas.width / 2, this.canvas.height / 2);
        ctx.restore();
    }
}

// 啟動遊戲
window.addEventListener('load', () => {
    const bgm = new Audio('LUCKY DRAW - Chance Chase Theme _ Forsaken UST.mp3');
    bgm.loop = false;
    bgm.volume = 0.5;
    let gameInstance = null;
    // 等待第一次互動才播放音樂
    const playBgmOnce = () => {
        if (bgm.paused) bgm.play();
        document.removeEventListener('mousedown', playBgmOnce);
        document.removeEventListener('keydown', playBgmOnce);
    };
    document.addEventListener('mousedown', playBgmOnce);
    document.addEventListener('keydown', playBgmOnce);
    bgm.addEventListener('ended', () => {
        if (gameInstance) gameInstance.displayVictory();
    });
    gameInstance = new Game();
    // 將 displayVictory 方法加到 Game
    gameInstance.displayVictory = function() {
        this.isVictory = true;
        const ctx = this.ctx;
        ctx.save();
        ctx.fillStyle = '#0f0';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('遊戲勝利！', this.canvas.width / 2, this.canvas.height / 2);
        ctx.restore();
    };
    // 當主角死亡時停止音樂
    gameInstance.displayGameOver = function() {
        bgm.pause();
        bgm.currentTime = 0;
        const ctx = this.ctx;
        ctx.fillStyle = 'red';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', this.canvas.width / 2, this.canvas.height / 2);
    };
});