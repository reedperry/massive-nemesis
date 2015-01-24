(function() {

    var meter = new FPSMeter({graph: true, decimals: 0});

    Entity.nextId = 0;

    var last, dt,
        step = 1000 / 60;

    var PLAYER_SPEED = 4;
    var BULLET_SPEED = 5;

    var bgCvs = document.getElementById('bg');
    var playerCvs = document.getElementById('player');
    var enemyCvs = document.getElementById('enemies');
    var bulletCvs = document.getElementById('bullets');
    var textCvs = document.getElementById('text');

    var bgCtx = bgCvs.getContext('2d');
    var playerCtx = playerCvs.getContext('2d');
    var enemyCtx = enemyCvs.getContext('2d');
    var bulletCtx = bulletCvs.getContext('2d');
    var textCtx = textCvs.getContext('2d');
    textCtx.font = '20px Verdana';
    textCtx.fillStyle = 'rgb(255,255,255)';

    var controls = {
        fire: 0
    };

    var background;
    var player;
    var enemies = [];
    var events = [];
    var playerBullets = [];
    var enemyBullets = [];

    var imageData = {
        ship: 'images/player-ship.png',
        enemy: 'images/enemy.png',
        bg: 'images/nemesis-background.png'
    };
    var images = {};
    loadImages(imageData, images, init);

    var bgScene, playerScene, enemyScene, bulletScene, textScene;
    var scenes = [];

    function init() {
        bgScene = new Scene(bgCvs.width, bgCvs.height, bgCtx);
        playerScene = new Scene(playerCvs.width, playerCvs.height, playerCtx);
        enemyScene = new Scene(enemyCvs.width, enemyCvs.height, enemyCtx);
        bulletScene = new Scene(bulletCvs.width, bulletCvs.height, bulletCtx);
        textScene = new Scene(textCvs.width, textCvs.height, textCtx);

        scenes = [bgScene, playerScene, enemyScene, bulletScene, textScene];

        background = new Background(bgScene, images.bg, 0, 0, bgCvs.width, bgCvs.height);

        player = new Player(playerScene, images.ship, 64, 64);
        player.moveToStartPosition();

        enemies.push(new Enemy(enemyScene, images.enemy, 20, 20, null, null, 25));
        enemies.push(new Enemy(enemyScene, images.enemy, 100, 125, null, null, 40));
        enemies.push(new Enemy(enemyScene, images.enemy, 525, 75, null, null, 30));
        enemies.push(new Enemy(enemyScene, images.enemy, 610, 215, null, null, 20));

        document.body.addEventListener('keydown', function(evt) {
            if (!evt.repeat) {
                events.push(evt);
            }
        });

        document.body.addEventListener('keyup', function(evt) {
            if (!evt.repeat) {
                events.push(evt);
            }
        });

        last = window.performance.now();
        window.requestAnimationFrame(draw);
    }

    function draw(time) {
        setTimeout(function() {
            requestAnimationFrame(draw);

            meter.tickStart();

            dt = Math.min(1000, time - last);
            last = time;

            doNextEvent();

            background.draw(dt);
            player.draw(dt);
            playerBullets.forEach(function(bullet, i) {
                bullet.draw(dt, i);
            });
            enemyBullets.forEach(function(bullet, i) {
                bullet.draw(dt, i);
            });
            enemies.forEach(function(enemy, i) {
                enemy.draw(dt, i);
                if (player.intersects(enemy)) {
                    gameOver();
                }
            });
            playerBullets.forEach(function(bullet, i) {
                enemies.forEach(function (enemy, j) {
                    if (bullet.intersects(enemy)) {
                        player.scorePoint();
                        playerBullets.splice(i, 1);
                        enemies.splice(j, 1);
                        bullet.remove();
                        enemy.remove();
                    }
                });
            });

            if (enemies.length === 0) {
               stageComplete();
            }

            enemyBullets.forEach(function(bullet, i) {
                if (bullet.intersects(player)) {
                    gameOver();
                    enemyBullets.splice(i, 1);
                    bullet.remove();
                }
            });

            // TODO don't need to draw unless score changes
            var textSize = textCtx.measureText('Score: ' + player.score);
            textCtx.clearRect(textScene.width - 100, 0, Math.ceil(textSize.width), 45);
            textCtx.fillText('Score: ' + player.score, textScene.width - 100, 30);

            meter.tick();

        }, step);
    }

    function gameOver() {
        player.kill();
        player.remove();
        textCtx.font = '40px Verdana';
        var textSize = textCtx.measureText('GAME OVER :(');
        textCtx.fillText('GAME OVER', (textScene.width * 0.5) - (textSize.width * 0.5), (textScene.height * 0.5) - 20);
        textCtx.font = '20px Verdana';
    }

    function stageComplete() {
        textCtx.font = '40px Verdana';
        var textSize = textCtx.measureText('STAGE COMPLETE!');
        textCtx.fillText('STAGE COMPLETE!', (textScene.width * 0.5) - (textSize.width * 0.5), (textScene.height * 0.5) - 20);
        textCtx.font = '20px Verdana';
    }

    function doNextEvent() {
        var evt = events.shift();
        if (evt) {
            processEvent(evt);
        }
    }

    function processEvent(evt) {
        switch (evt.keyCode) {
            // SPACE
            case 32:
                if (evt.type === 'keydown') {
                    controls.fire = controls.fire + 1;
                }
                break;
            // LEFT
            case 37:
                if (evt.type === 'keydown') {
                    controls.left = true;
                } else if (evt.type === 'keyup') {
                    controls.left = false;
                }
                break;
            // UP
            case 38:
                if (evt.type === 'keydown') {
                    controls.up = true;
                } else if (evt.type === 'keyup') {
                    controls.up = false;
                }
                break;
            // RIGHT
            case 39:
                if (evt.type === 'keydown') {
                    controls.right = true;
                } else if (evt.type === 'keyup') {
                    controls.right = false;
                }
                break;
            // DOWN 
            case 40:
                if (evt.type === 'keydown') {
                    controls.down = true;
                } else if (evt.type === 'keyup') {
                    controls.down = false;
                }
                break;
            // 'p' to print debug stuff
            case 80:
                if (evt.type === 'keydown') {
                    console.log('Scenes: %O', scenes);
                    console.log('Player: %O', player);
                }
                break;
            // 'r' to reset player ship
            case 82:
                if (evt.type === 'keydown') {
                    console.log('Resetting player...');
                    player.moveToStartPosition();
                }
                break;
        }
    }

    function Scene(width, height, ctx) {
        if (!(this instanceof Scene)) {
            return new Scene(width, height, ctx);
        }
        this.entities = [];

        this.width = width; 
        this.height = height;
        this.ctx = ctx;
    }

    Scene.prototype.addEntity = function(entity) {
        this.entities.push(entity);
    };

    Scene.prototype.deleteEntity = function(id) {
        for (var i = 0; i < this.entities.length; i++) {
            if (this.entities[i].id === id) {
                this.entities.splice(i, 1);
            }
        }
    };

    Scene.prototype.getEntities = function() {
        return this.entities;
    };

    function Entity(scene, img, x, y, width, height) {
        this.scene = scene;
        this.x = x ? x : 0;
        this.y = y ? y : 0;
        if (img) {
            this.img = img;
        }
        if (width && height) {
            this.width = width;
            this.height = height;
        } else if (img) {
            this.width = img.width;
            this.height = img.height;
        }
        this.id = ++Entity.nextId;
        this.scene.addEntity(this);
    }

    Entity.prototype.remove = function() {
        this.scene.ctx.clearRect(this.x-1, this.y-1, this.width+2, this.height+2);
        this.scene.deleteEntity(this.id);
    };

    Entity.prototype.intersects = function(entity) {
        if (this.y <= entity.y + entity.height && this.y + this.height >= entity.y) {
            var halfWidth = this.width / 2;
            if (this.x + halfWidth >= entity.x && this.x <= entity.x + entity.width) {
                return true;
            }
        }
        return false;
    };

    function Background(scene, img, x, y, width, height) {
        Entity.call(this, scene, img, x, y, width, height);

        this.draw = function(dt) {
            this.y += dt / step;
            this.scene.ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
            this.scene.ctx.drawImage(this.img, this.x, 0 - this.height + this.y, this.width, this.height);

            if (this.y > this.height) {
                this.y = 0;
            }
        }
    }
    Background.prototype = Object.create(Entity.prototype);

    function Player(scene, img, width, height) {

        Entity.call(this, scene, img, 0, 0, width, height);
        this.score = 0;
        this.alive = true;

        this.moveToStartPosition = function() {
            this.scene.ctx.clearRect(this.x-1, this.y-1, this.width+2, this.height+2);
            this.x = (this.scene.width / 2) - (this.width / 2);
            this.y = this.scene.height - this.height - 5;
            this.scene.ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
        };

        this.scorePoint = function() {
            this.score++;
        };

        this.kill = function() {
            this.alive = false;
        };

        this.draw = function(dt) {
            if (!this.alive) {
                this.scene.ctx.clearRect(this.x-1, this.y-1, this.width+2, this.height+2);
                return;
            }
            if (controls.up || controls.down || controls.right || controls.left) {
                this.scene.ctx.clearRect(this.x-1, this.y-1, this.width+2, this.height+2);
                if (controls.up) {
                    this.y = Math.max(0, this.y - ((dt / step) * PLAYER_SPEED));
                }
                if (controls.down) {
                    this.y = Math.min(this.scene.height - this.height, this.y + ((dt / step) * PLAYER_SPEED));
                }
                if (controls.left) {
                    this.x = Math.max(0, this.x - ((dt / step) * PLAYER_SPEED));
                }
                if (controls.right) {
                    this.x = Math.min(this.scene.width - this.width, this.x + ((dt / step) * PLAYER_SPEED));
                }
                this.scene.ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
            }

            if (controls.fire > 0) {
                this.fire(controls);
            }
        };
    }
    Player.prototype = Object.create(Entity.prototype);
    Player.prototype.fire = function() {
            var bullet = new Bullet(this.scene, this.x + (this.width / 2 - 2), this.y, -1);
            playerBullets.push(bullet);
            controls.fire = controls.fire - 1;
        };


    function Bullet(scene, startX, startY, yDir) {
        Entity.call(this, scene, null, startX, startY, 4, 10);
        this.yDir = yDir;
    }
    Bullet.prototype = Object.create(Entity.prototype);

    Bullet.prototype.move = function(dt) {
        this.y += this.yDir * (dt / step) * BULLET_SPEED;
    };

    Bullet.prototype.draw = function(dt, i) {
            this.scene.ctx.clearRect(this.x-1, this.y-1, this.width+2, this.height+2);
            this.move(dt);
            if (this.y + this.height > 0) {
                this.scene.ctx.fillStyle = 'rgb(0,255,0)';
                this.scene.ctx.fillRect(this.x, this.y, this.width, this.height);
            } else {
                this.scene.deleteEntity(this.id);
                playerBullets.splice(i, 1);
            }
        };

    function Enemy(scene, img, x, y, width, height, speed) {
        Entity.call(this, scene, img, x, y, width, height);

        this.speed = speed;
    }
    Enemy.prototype = Object.create(Entity.prototype);
    Enemy.prototype.fire = function() {
        var bullet = new Bullet(this.scene, this.x + (this.width * .5 - 2), this.y + this.height, 1);
        enemyBullets.push(bullet);
    };
    Enemy.prototype.move = function(dt) {
        var xRand = Math.random();
        var yRand = Math.random();
        var xDir, yDir;
        if (xRand <= .333) {
            xDir = 0;
        } else if (xRand > .333 && xRand < .666) {
            xDir = 1;
        } else {
            xDir = -1;
        }
        if (yRand <= .333) {
            yDir = 0;
        } else if (yRand > .333 && yRand < .666) {
            yDir = 1;
        } else {
            yDir = -1;
        }

        if (xDir > 0) {
            this.x = Math.min(this.scene.width - this.width, this.x + ((dt / step) * this.speed * xDir));
        } else if (xDir < 0) {
            this.x = Math.max(0, this.x + ((dt / step) * this.speed * xDir));
        }

        if (yDir > 0) {
            // Keep enemies out of the bottom 25% of the screen
            this.y = Math.min(this.scene.height - (this.scene.height * .25) - this.height, this.y + ((dt / step) * this.speed * yDir));
        } else if (yDir < 0) {
            this.y = Math.max(0, this.y + ((dt / step) * this.speed * yDir));
        }
    };

    Enemy.prototype.draw = function(dt, i) {
        this.scene.ctx.clearRect(this.x-1, this.y-1, this.width+2, this.height+2);
        if (Math.random() < .025) {
            this.move(dt);
        }
        if (Math.random() < .005) {
            this.fire();
        }
        this.scene.ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    };


    function loadImages(imageData, imageMap, doneLoading) {
        var names = Object.keys(imageData);
        var toLoad = names.length;
        console.log('Loading ' + toLoad + ' images...');
        names.forEach(function(name) {
            var img = new Image();
            img.addEventListener('load', function() {
                imageMap[name] = img;
                toLoad = toLoad - 1;
                console.log('Loaded ' + name + ', ' + toLoad + ' images remaining...');
                if (toLoad === 0) {
                    doneLoading();
                }
            });
            img.src = imageData[name];
        });
    }

})();
