(function() {
    "use strict";
    
    def("SNC.Wizard", {
        extend: Jxl.Sprite,
        init : function(x, y, me) {
            var self = this;
            
            this.me = me;
            Jxl.Sprite.prototype.init.call(this, {
                x: x,
                y: y,
                graphic : Jxl.am.get("wizard"),
                width: 47
            });
            
            this.emitter = new Jxl.Emitter();
            this.emitter.createSprites(Jxl.am.get("bunny"), 8, new Jxl.Point({x: 36, y: 21}), true, true, 0.8);
            this.emitter.setYSpeed(-50, 50);
            
            setTimeout(function() {
                Jxl.state.particles.add(self.emitter);
            }, 0);
            
            if(me) {
                this.acceleration.y = 800;
                this._bounce = 0.5;
                this.speed = 300;
                this.drag = new Jxl.Point({x:150,y:0});
            } else {
                this.fixed = true;    
            }
            this.addAnimation("run", [1, 2, 3], .03);
            this.addAnimation("idle", [0], .5);
        },
        update: function() {
            if(this.me) {
                if(Jxl.keys.on('A')) {
                     this.velocity.x = -this.speed;
                     this.reverse = true;
                } else if(Jxl.keys.on('D')) {
                     this.reverse = false;
                     this.velocity.x = this.speed;
                } 
                
                if(Jxl.keys.on("P")) {
                    this.bunnyStorm();    
                }
                
                if((Jxl.keys.press(32)) && (this.onFloor || this.onSide)) {
                    this.velocity.y = -280;
                }
                
                if(this.velocity.x != 0) {
                    this.play("run");    
                } else {
                    this.play("idle");    
                }
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
        },
        pack : function() {
           return {
               reverse : this.reverse,
               x : this.x, 
               y : this.y 
           };
        },
        bunnyStorm : function() {
            var factor = this.reverse ? -1 : 1;
            
            this.emitter.x = this.x + this.width/2 + this.width/2 * factor + Math.random() * 5;
            this.emitter.y = this.y + this.height/4 + Math.random() * 5;
            
            this.emitter.setXSpeed(500*factor, 800*factor);
            this.emitter.start(true, 5, 8);
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
            this.flicker(1);
        }
    });
    
    def("SNC.GameState", {
        extend: Jxl.State,
        init: function() {
            var self = this;
            
            Jxl.State.prototype.init.call(this);
            
            //Maps
            this.maps = new Jxl.Group();
            var myMap = this.map = new SNC.Map();
            this.maps.add(myMap);
            
            //Particles
            this.particles = new Jxl.Group();
            
            //Avatars
            this.avatars = new Jxl.Group();
            this.avatar = new SNC.Wizard(myMap.widthInTiles*myMap._tileWidth/2, myMap.heightInTiles*myMap._tileHeight/2, true);
            this.add(this.avatar);
            
            this.add(this.maps, this.avatars, this.particles);
            
            Jxl.followLead = new Jxl.Point({x:-0.01, y:-0.01});
            Jxl.follow(this.avatar);
            
            //setup networking
            this.net = new Peer(null, { host: "64.187.160.30", port: 9091, key : "peerjs" });
            this.peers = {};
            this.net.on("open", this.onOpen.bind(this));
            this.net.on("connection", this.onConnection.bind(this));
        },
        onClose : function(conn) {
            conn.avatar.kill();
        },
        onOpen : function(id) {
            window.location.hash = id;
            this.summon();
        },
        onData : function(conn, data) {
            switch(data.type) {
                case "avatar":
                    if(!conn.avatar) {
                        conn.avatar = new SNC.Wizard(data.pack.x, data.pack.y);
                        this.avatars.add(conn.avatar);    
                    }
                    conn.avatar.x = data.pack.x+conn.offset.x;
                    conn.avatar.y = data.pack.y+conn.offset.y;
                    conn.avatar.reverse = data.pack.reverse;
                    break;
                    
                case "offer":
                    conn.send({type:"accept", x: 1, y:0});
                case "accept":
                    var map = new SNC.Map();
                    map.x = data.x*map.width;
                    conn.offset = { x : data.x*map.width, y: data.y*map.height};
                    this.add(map);
                    break;
            }
        },
        onConnection : function(conn, connecter) {
            this.peers[conn.peer] = conn;
            conn.on("data", this.onData.bind(this, conn));
            conn.on("close", this.onClose.bind(this, conn));
            
            if(connecter) {
                conn.send({type: "offer", x : -1, y: 0});
            }
        },
        summon : function() {
            var self = this;
            this.net.listAllPeers(function(peers) {
                // woo lets try to get a peer
                
                peers.forEach(function(peer) {
                   if(peer != self.net.id) {
                       var conn = self.net.connect(peer); 
                       conn.on("open", self.onConnection.bind(self, conn, true));
                   }
                });        
            });
        },
        update : function() {
            var self = this;
            
            Jxl.State.prototype.update.call(this);
            Jxl.Util.collide(this.avatar, this.maps);
            Jxl.Util.collide(this.avatar, this.avatars);
            Jxl.Util.collide(this.particles, this.avatars);
            Jxl.Util.collide(this.particles, this.maps);
            
            // net update
            Object.keys(this.peers).forEach(function(peer) {
                self.peers[peer].send({type:"avatar", pack: self.avatar.pack()});
            });
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
            "tile" : "assets/tile.png",
            "bunny" : "assets/bunny.png"
        },
        "data" : {
            "map" : "assets/map.csv"    
        }
    }, function() {
        Jxl.state = new SNC.GameState();
        Jxl.start();
    });
} ());