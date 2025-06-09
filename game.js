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
        
        this.setupControls();
        this.gameLoop();
    }

    setupControls() {
        // 鍵盤按下事件
        document.addEventListener('keydown', (e) => {
            if (this.keys.hasOwnProperty(e.key)) {
                this.keys[e.key] = true;
            }
        });

        // 鍵盤放開事件
        document.addEventListener('keyup', (e) => {
            if (this.keys.hasOwnProperty(e.key)) {
                this.keys[e.key] = false;
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
            // 檢查子彈碰撞
            let isHit = false;
            this.player.bullets = this.player.bullets.filter(bullet => {
                if (this.checkCollision(bullet, enemy)) {
                    isHit = true;
                    this.score += 10;
                    document.getElementById('scoreValue').textContent = this.score;
                    return false;
                }
                return true;
            });
            
            // 檢查與玩家碰撞
            if (this.checkCollision(enemy, this.player) && !this.player.isInvincible) {
                const damage = Math.floor(Math.random() * 5) + 1;
                this.player.takeDamage(damage);
                document.getElementById('hpValue').textContent = this.player.hp;
                return false;
            }
            
            // 檢查是否在畫面外
            if (enemy.x < -50 || enemy.x > this.canvas.width + 50 ||
                enemy.y < -50 || enemy.y > this.canvas.height + 50) {
                return false;
            }
            
            return !isHit;
        });
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
        this.spawnEnemy();
        this.player.update();
        
        // 更新敵人移動方向（朝向玩家）
        this.enemies.forEach(enemy => {
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const angle = Math.atan2(dy, dx);
            enemy.speedX = Math.cos(angle) * enemy.speed;
            enemy.speedY = Math.sin(angle) * enemy.speed;
            enemy.update();
        });
        
        this.checkCollisions();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.player.draw(this.ctx);
        this.enemies.forEach(enemy => enemy.draw(this.ctx));
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(this.gameLoop);
    }
}

// 啟動遊戲
window.addEventListener('load', () => {
    new Game();
});