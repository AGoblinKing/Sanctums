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
            this.emitter.createSprites(Jxl.am.get("bunny"), 28, new Jxl.Point({x: 36, y: 21}), true, true, 0.8);
            this.emitter.setYSpeed(-300, 300);
            
            setTimeout(function() {
                Jxl.state.particles.add(self.emitter);
            }, 0);
            
            this.lastBunny = 0;
            
            if(me) {
                this.acceleration.y = 800;
                this._bounce = 0.5;
                this.speed = 300;
                this.drag = new Jxl.Point({x:150,y:0});
            } else {
                this.fixed = true;
                this.moves = false;
            }
            
            this.addAnimation("run", [2, 1, 3], .03);
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
                
                this.lastBunny += Jxl.delta; 
                
                if(Jxl.keys.on("P") && this.lastBunny > .5) {
                    this.bunnyStorm();    
                    this.lastBunny = 0;
                }
                
                if((Jxl.keys.press(32)) && (this.onFloor || this.onSide)) {
                    this.velocity.y = -280;
                }
                
            }
            if(this.velocity.x != 0) {
                this.play("run");    
            } else {
                this.play("idle");    
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
               y : this.y,
               vx : this.velocity.x,
               vy : this.velocity.y
           };
        },
        bunnyStorm : function() {
            var factor = this.reverse ? -1 : 1;
            
            this.emitter.x = this.x + this.width/2 + this.width/2 * factor + Math.random() * 5;
            this.emitter.y = this.y + this.height/4 + Math.random() * 5;
            
            this.emitter.setXSpeed(500*factor, 800*factor);
            this.emitter.start(true, 1, 1);
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
            this.slots = {};
            
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
        waitDestroy: function(target) {
            target.flicker(1);
            setTimeout(function() {
                target.kill();    
            }, 1000);
        },
        onClose : function(conn) {
            if(conn.avatar) {
                this.waitDestroy(conn.avatar);
            }
            if(conn.dir) {
                delete this.slots[conn.dir];
                //coould attempt a summon here
            }
            if(conn.map) {
                this.waitDestroy(conn.map);   
            }
            if(this.peers[conn.id]) 
                delete this.peers[conn.id];
        },
        onOpen : function(id) {
            window.location.hash = id;
            this.summon();
        },
        sane : function(data) {
            return data < 10000 && data > -10000;    
        },
        openSlots : function() {
            var available = Object.keys(this.dirs),
                self = this;
            
            return available.filter(function(dir) { return self.slots[dir] ? false : true; });
        },
        openSlot : function() {
            var open = this.openSlots();
            
            if(open.length === 0) return false;
            
            return open[Math.floor(Math.random()*open.length)];
        },
        reverseSlot : function(slot) {
            switch(slot) {
                case "left": return "right";
                case "right": return "left";
                case "top": return "bottom";
                case "bottom": return "top";
            }
        },
        onData : function(conn, data) {
            switch(data.type) {
                case "avatar":
                    if(!data.pack && [data.x, data.y, data.vx, data.vy].reduce(function(prev, cur){return prev || !sane(cur); })) {
                        conn.close();
                        return; 
                    }
                    
                    if(!conn.avatar) {
                        conn.avatar = new SNC.Wizard(data.pack.x, data.pack.y);
                        this.avatars.add(conn.avatar);    
                    }
                    conn.avatar.x = data.pack.x+conn.offset.x;
                    conn.avatar.y = data.pack.y+conn.offset.y;
                    conn.avatar.velocity.x = data.pack.vx;
                    conn.avatar.velocity.y = data.pack.vy;
                    conn.avatar.reverse = data.pack.reverse;
                    break;
                    
                case "offer":
                    var slot = this.reverseSlot(data.slot);
                    if(!this.slots[slot]) {
                        conn.send({type:"accept", slot: data.slot});
                        this.makeMap(slot, conn);
                    } else {
                        slot = this.openSlot();
                        if(slot) {
                            this.slots[slot] = "temp";
                        }
                        conn.send({type:"reject", slot : data.slot, newOffer: slot}); 
                    }
                    
                    break;
                case "reject":
                    //aw didn't want my slot
                    delete this.slots[data.slot];
                    
                    // but the counter offer could be okay
                    if(data.newOffer) {
                        var mySlot = this.reverseSlot(data.newOffer);
                        if(!this.slots[mySlot]) {
                            conn.send({type:"accept", slot:data.slot});
                            this.makeMap(mySlot, conn);
                        } else {
                            conn.send({type:"reject", slot : data.newOffer});   
                        }
                    }
                    break;
                    
                case "accept":
                    this.makeMap(data.slot, conn);
                    this.attemptSummon();
                    break;
            }
        },
        dirs : {
            left : {x:-1,y:0},
            right : {x:1,y:0},
            top : {x:0,y:-1},
            bottom: {x:0,y:1}
        },
        makeMap : function(dir, conn) {
            console.log("making ", dir);
            var map = new SNC.Map(),
                x = this.dirs[dir].x,
                y = this.dirs[dir].y;

            map.x = x*map.width;
            map.y = y*map.height;
            conn.map = map;
            conn.dir = dir;
            conn.offset = { x : x*map.width, y: y*map.height};
            this.add(map);
            this.peers[conn.peer] = conn;
        },
        onConnection : function(conn, connecter) {
            conn.on("data", this.onData.bind(this, conn));
            conn.on("close", this.onClose.bind(this, conn));
            
            if(connecter) {
                var slot = this.openSlot();
                if(slot) {
                    this.slots[slot] = "temp";
                    conn.send({type: "offer", slot: slot});
                } else {
                    conn.close();
                }
            }
        },
        attemptSummon : function() {
            if(this.peerList.length === 0) {
                return setTimeout(this.summon.bind(this), 5000);   
            }
            
            var peer = this.peerList.pop();
            if(peer === this.net.id || Object.keys(this.peers).indexOf(peer) !== -1) {
               return this.attemptSummon();    
            }
            
            var conn = this.net.connect(peer);
            conn.on("open", this.onConnection.bind(this, conn, true));
        },
        summon : function() {
            var self = this;
            this.net.listAllPeers(function(peers) {
                // woo lets try to get a peer
                self.peerList = peers;
                self.attemptSummon();       
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