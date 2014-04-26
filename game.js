var Sanctums = (function() {
    "use strict";
    // UTILS
    var Util = {
        howMany : function(amount, diviser) {
            return Math.round(amount/diviser);   
        }
    };
    
    // RAWR GAME INFO
    var tileSize = 32,
        jumpTimer = 100,
        width = 200,
        height = 200,
        timeTrack = 0,
        peers = [],
        Sanctums = {
            addSanctum : function(trueName) {
                if(peers.indexOf(trueName) === -1) {
                    var canvas = document.createElement("canvas");

                    document.body.appendChild(canvas);
                    canvas.width = Sanctums.map.width * tileSize;
                    canvas.height = Sanctums.map.height * tileSize;

                    var remote = MultiCanvas(canvas).connect(trueName).events(document, ["keydown", "keypress", "keyup"]);
                }
            }
        },
        proto = {
            preload : function() {
                this.load.image("ground_1x1", "assets/tile.png");
                this.load.image("wizard", "assets/wizard.png");
            },
            create : function() {
                this.stage.backgroundColor = "#fdfcf8";                
                game.physics.startSystem(Phaser.Physics.NINJA);
                
                // Setup Map
                var map = Sanctums.map = this.add.tilemap(null, tileSize, tileSize, Util.howMany(width, tileSize), Util.howMany(height, tileSize));
                Sanctums.map.addTilesetImage("ground_1x1");
                Sanctums.list = [createSanctum()]; // may not be needed
                
                Sanctums.mapPhysics = Sanctums.list.map(function(layer) {
                    return game.physics.ninja.convertTilemap(map, layer,  { "0" : 1});
                });
                
                // avatar!
                var avatar = Sanctums.avatar = this.add.sprite(map.width/2*tileSize, map.height/2*tileSize, "wizard");
                avatar.anchor.set(0.5, 0.5);
                this.physics.ninja.enableAABB(avatar);
                this.camera.follow(avatar, Phaser.Camera.FOLLOW_PLATFORMER);
                
                // input
                Sanctums.keys = {
                    jump : game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR),
                    left : game.input.keyboard.addKey(Phaser.Keyboard.A),
                    right : game.input.keyboard.addKey(Phaser.Keyboard.D)
                }

                var mc = Sanctums.mc = 
                    MultiCanvas(document.body.querySelector("canvas"))
                        .host();
                
                mc.quality = 0.4;
                
                mc.peer.on("open", function(id) { window.location.hash = id; });
                mc.peer.on("connection", function(conn) { Sanctums.addSanctum(conn.peer); });
                mc.peer.listAllPeers(function(peers) {
                    peers.forEach(function(peer) {
                        if(peer != mc.peer.id) {
                            Sanctums.addSanctum(peer);   
                        }
                    });
                });
            },
            update : function() {
                var cursors = Sanctums.cursors,
                    keys = Sanctums.keys,
                    avatar = Sanctums.avatar,
                    collide = false;
                
                
                Sanctums.mapPhysics.forEach(function(layer) {
                    layer.forEach(function(tile) {
                        collide = collide || Sanctums.avatar.body.aabb.collideAABBVsTile(tile.tile);
                    });
                });
                
                
                if(keys.left.isDown) {
                    Sanctums.avatar.body.moveLeft(20);
                    avatar.scale.x = -1;
                } else if (keys.right.isDown) {
                    Sanctums.avatar.body.moveRight(20);
                    avatar.scale.x = 1;
                }

                if(keys.jump.isDown && collide && !avatar.lastKey) {
                    avatar.body.moveUp(200);
                }
                
                avatar.lastKey = keys.jump.isDown;

            },
            render : function() {
                timeTrack += this.time.elapsed;
                if(timeTrack > 1000/24) {
                    Sanctums.mc.tick();
                    timeTrack = 0;
                }
            }
        };
    
    
    // GAME FUNCS
    function createSanctum() {
       
        var map = Sanctums.map,
            sanctum = Sanctums.map.create(0, map.width, map.height, tileSize, tileSize);

        sanctum.scrollFactorX = 0.5;
        sanctum.scrollFactorY = 0.5;
        sanctum.resizeWorld();
        
        for(var x = 0; x < sanctum.map.width; x++) {
            Sanctums.map.putTile(0, x, 0, sanctum);
            Sanctums.map.putTile(0, x, Sanctums.map.height-1, sanctum);
        }
        
        for(var y = 0; y < sanctum.map.height; y++) {
            Sanctums.map.putTile(0, 0, y, sanctum);
            Sanctums.map.putTile(0, Sanctums.map.width-1, y, sanctum);
        }
        
        return sanctum;
    }
    
    
    // CREATE EL GAME
    var game = new Phaser.Game(
        Util.howMany(width, tileSize) * tileSize, 
        Util.howMany(height, tileSize) * tileSize, 
        Phaser.AUTO, 
        "sanctums",
        proto
    );
    
    return Sanctums;
    
} ());
