(function() {
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
        width = document.body.clientWidth,
        height = document.body.clientHeight,
        Sanctums = {},
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
                var avatar = Sanctums.avatar = this.add.sprite(width/2, height/2, "wizard");
                avatar.anchor.set(0.5);
                this.physics.ninja.enableAABB(avatar);
                this.camera.follow(avatar);
                // input
                Sanctums.cursors = game.input.keyboard.createCursorKeys();
                Sanctums.keys = {
                    jump : game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR)
                }
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
                
                
                if(cursors.left.isDown) {
                    Sanctums.avatar.body.moveLeft(20);
                } else if (cursors.right.isDown) {
                    Sanctums.avatar.body.moveRight(20);
                }

                if(keys.jump.isDown && collide && !avatar.lastKey) {
                    avatar.body.moveUp(200);
                }
                
                avatar.lastKey = keys.jump.isDown;

            },
            render : function() {

            }
        };
    
    
    // GAME FUNCS
    function createSanctum() {
       
        var map = Sanctums.map,
            sanctum = Sanctums.map.create(0, map.width, map.height, tileSize, tileSize);

        sanctum.scrollFactorX = 0.5;
        sanctum.scrollFactorY = 0.5;
        sanctum.resizeWorld(); 
        
        for(var x = 0; x < sanctum.width; x++) {
            Sanctums.map.putTile(0, x, 0, sanctum);
            Sanctums.map.putTile(0, x, Sanctums.map.height-1, sanctum);
        }
        
        for(var y = 0; y < sanctum.height; y++) {
            Sanctums.map.putTile(0, 0, y, sanctum);
            Sanctums.map.putTile(0, Sanctums.map.width-1, y, sanctum);
        }
        
        return sanctum;
    }
    
    
    // CREATE EL GAME
    var game = new Phaser.Game(
        width, 
        height, 
        Phaser.AUTO, 
        "sanctums",
        proto
    );
    
} ());
