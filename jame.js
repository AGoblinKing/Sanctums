(function() {
    "use strict";
    
    def("SNC.Wizard", {
        extend: Jxl.Sprite,
        init : function(x, y) {
            Jxl.Sprite.prototype.init.call(this, {
                x: x,
                y: y,
                graphic : Jxl.am.get("wizard")
            });
            this._bounce = 0.5;
            this.drag = new Jxl.Point({x:150,y:0});
            this.speed = 300;
            this.acceleration.y = 800;
        },
        update: function() {
            if(Jxl.keys.on('A')) {
                 this.velocity.x = -this.speed;
                 this.reverse = true;
            } else if(Jxl.keys.on('D')) {
                 this.reverse = false;
                 this.velocity.x = this.speed;
            } 
            
            if((Jxl.keys.press(32)) && (this.onFloor || this.onSide)) {
                this.velocity.y = -280;
            }    
            Jxl.Sprite.prototype.update.call(this);
        },
        hitBottom: function(Contact, Velocity) {
            this.onFloor = true;
            if (((this.velocity.y > 0) ? this.velocity.y : -this.velocity.y) > this._bounce * 100) {
                this.velocity.y = -this.velocity.y * this._bounce;
                if (this.angularVelocity != 0) this.angularVelocity *= -this._bounce;
            }
            else {
                this.angularVelocity = 0;
                Jxl.Sprite.prototype.hitBottom.call(this, Contact, Velocity);
            }
            this.velocity.x *= this._bounce;
        }
    });
    
    def("SNC.Map", {
        extend: Jxl.TileMap,
        init : function() {
            Jxl.TileMap.prototype.init.call(this, {
                tileGraphic: Jxl.am.get("tile"),
                mapData: Jxl.am.get("map"),
                collideIndex: 1
            });
        }
    });
    
    def("SNC.GameState", {
        extend: Jxl.State,
        init: function() {
            Jxl.State.prototype.init.call(this);
            this.map = new SNC.Map();
            this.player = new SNC.Wizard(this.map.widthInTiles*this.map._tileWidth/2, this.map.heightInTiles*this.map._tileHeight/2);
            
            this.add(this.map, this.player);
            
            Jxl.followLead = new Jxl.Point({x:-0.01, y:-0.01});
            Jxl.follow(this.player);
        },
        update : function() {
            Jxl.State.prototype.update.call(this);
            Jxl.Util.collide(this.player, this.map);
        }
    });
    
    Jxl.config({
        canvas : document.body.querySelector("canvas"),
        width : window.innerWidth, 
        height : window.innerHeight,
        scale : new Jxl.Point({ x : 1, y : 1 })
    });
    
    Jxl.am.load({
        "images" : {
            "wizard" : "assets/wizard.png",
            "tile" : "assets/tile.png"
        },
        "data" : {
            "map" : "assets/map.csv"    
        }
    }, function() {
        Jxl.state = new SNC.GameState();
        Jxl.start();
    });
} ());