(function() {
    "use strict";
    var score = document.getElementById("score");
    
    def("SNC.Wizard", {
        extend: Jxl.Sprite,
        init : function(x, y, me) {
            var self = this;
            
            this.spawn = {x:x,y:y};
            this.me = me;
            Jxl.Sprite.prototype.init.call(this, {
                x: x,
                y: y,
                graphic : Jxl.am.get("wizard"),
                width: 47
            });
            
            this.emitter = new Jxl.Emitter();
            this.emitter.createSprites(Jxl.am.get("bunny"), 28, new Jxl.Point({x: 36, y: 21}), true, true, 0.8);
            this.emitter.members.forEach(function(bunny) { bunny.isBunny = true; });
            
            this.emitter2 = new Jxl.Emitter();
            this.emitter2.createSprites(Jxl.am.get("bunny"), 1, new Jxl.Point({x: 36, y: 21}), true, true, 0.8);
            this.emitter2.setYSpeed(-300, 300);
            
            this.boom = new Jxl.Sprite({graphic: Jxl.am.get("boom")});
            this.boom.visible = false;
            
            setTimeout(function() {
                Jxl.state.particles.add(self.emitter);
                Jxl.state.add(self.emitter2);
                Jxl.state.add(self.boom);
            }, 0);
            
            this.lastBunny = 0;
            this.bunnySummonTime = 0;
            
            if(me) {
                this.acceleration.y = 800;
                this._bounce = 0.5;
                this.speed = 300;
                this.drag = new Jxl.Point({x:150,y:0});
            } else {
                this.fixed = true;
                //this.moves = false;
            }
            
            this.addAnimation("run", [2, 1, 3], .03);
            this.addAnimation("idle", [0], .5);
        },
        bunnies: 1,
        modScore: function(mod) {
            this.bunnies = Math.max(this.bunnies + mod, 1);  
            score.innerHTML = this.bunnies;
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
                
                if(Jxl.mouse.click && this.lastBunny > 2) {
                    this.bunnyStorm();    
                } 
                
                if((Jxl.keys.press(32)) && (this.onFloor || this.onSide)) {
                    this.velocity.y = -280;
                }
                
                if(this.y > 2000) {
                    this.respawn();
                }
            }
            
            this.lastBunny += Jxl.delta;
            if(this.lastBunny > 1) { this.boom.visible = false; }
            
            this.bunnySummonTime += Jxl.delta;
            if(this.bunnySummonTime > 2) {
                this.bunnySummon();
            } else {
                this.emitter2.kill();    
            }
            
            if(this.velocity.x != 0) {
                this.play("run");    
            } else {
                this.play("idle");    
            }
            Jxl.Sprite.prototype.update.call(this);
        },
        respawn: function() {
            this.x = this.spawn.x;
            this.y = this.spawn.y;
            this.flicker(1);
        },
        hit: function(contact, velocity) {
            if(contact.isBunny) {
                this.flicker(1);
                contact.kill();
                
                if(this.me) {
                    this.modScore(-1);
                    this.respawn();
                } else {
                    Jxl.state.avatar.modScore(1);    
                }
            }
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
            var pack = {
               reverse : this.reverse,
               x : this.x, 
               y : this.y,
               vx : this.velocity.x,
               vy : this.velocity.y
            };
             
            if(this.stormed) {
                pack.stormed = this.stormed;    
            }
            
            this.stormed = false;
            return pack;
        },
        bunnySummon : function() {
            var factor = this.reverse ? -1 : 1;
            
            this.emitter2.x = this.x + this.width/2 + this.width/2 * factor + Math.random() * 5;
            this.emitter2.y = this.y + this.height/4 + Math.random() * 5;
            
            this.emitter2.setXSpeed(500*factor, 800*factor);
            this.emitter2.start(true, 1, 1);  
        },
        bunnyStorm : function(x, y, bunnies, reverse) {
            var factor = reverse || this.reverse ? -1 : 1;
            
            this.lastBunny = 0;
            this.emitter.x = x || Jxl.mouse.x;
            this.emitter.y = y || Jxl.mouse.y;

            this.boom.x = this.emitter.x - this.boom.origin.x;
            this.boom.y = this.emitter.y - this.boom.origin.y;
            this.boom.visible = true;
            
            if(!bunnies) {
                bunnies = [];
                for(var i = 0; i < this.bunnies; i++) {
                    bunnies.push({
                        xSpeed : factor * (500 + Math.round(Math.random()*300)),
                        ySpeed : -300 + Math.round(Math.random()*600)
                    });
                }
            }
            
            for(var i = 0; i < bunnies.length; i++) {
                var bun = bunnies[i];
                
                this.emitter.setXSpeed(bun.xSpeed, bun.xSpeed);
                this.emitter.setYSpeed(bun.ySpeed, bun.ySpeed);   

                this.emitter.start(true, 2, 1);
            }
            
            this.bunnySummonTime = 0;
            
            if(this.me) {
                this.stormed = {
                    x: this.emitter.x,
                    y: this.emitter.y,
                    reverse: factor,
                    bunnies: bunnies
                };
            }
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
            Jxl.Util.setWorldBounds(-4000, -4000, 4000, 4000);
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
            this.avatars.add(this.avatar);
            
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
                this.attemptSummon();
            }
            if(this.peers[conn.id]) 
                delete this.peers[conn.id];
        },
        onOpen : function(id) {
            //window.location.hash = id;
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
                    var pack = data.pack;
                    
                    if(!data.pack || data.pack == null || [data.pack.x, data.pack.y, data.pack.vx, data.pack.vy].reduce(function(prev, cur){ return prev || !sane(cur); }), false) {
                        conn.close();
                        return; 
                    }
                    if(pack.stormed && [pack.stormed.x, pack.stormed.y].reduce(function(prev, cur) { return prev || !sane(cur); }), false) {
                        conn.close();
                        return;   
                    }
                    
                    if(!pack) return;
                    
                    if(!conn.avatar) {
                        conn.avatar = new SNC.Wizard(data.pack.x, data.pack.y);
                        this.avatars.add(conn.avatar);    
                    }
                    
                    conn.avatar.x = data.pack.x+conn.offset.x;
                    conn.avatar.y = data.pack.y+conn.offset.y;
                    conn.avatar.velocity.x = data.pack.vx;
                    conn.avatar.velocity.y = data.pack.vy;
                    conn.avatar.reverse = data.pack.reverse;
                    
                    if(pack.stormed) {
                        conn.avatar.bunnyStorm(pack.stormed.x+conn.offset.x, pack.stormed.y+conn.offset.y, pack.bunnies, pack.stormed.reverse);    
                    }
                    
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
            var map = new SNC.Map(),
                x = this.dirs[dir].x,
                y = this.dirs[dir].y;
            console.log("made map");
            map.x = x*map.width;
            map.y = y*map.height;
            conn.map = map;
            conn.dir = dir;
            conn.offset = { x : x*map.width, y: y*map.height};
            this.maps.add(map);
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
            if(this.peerList.length === 0 && !this.openSlot()) {
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
            Jxl.Util.collide(this.avatars, this.maps);
            Jxl.Util.collide(this.particles, this.avatars);
            Jxl.Util.collide(this.particles, this.maps);
            
            // net update
            var pack = self.avatar.pack();
            Object.keys(this.peers).forEach(function(peer) {
                self.peers[peer].send({type:"avatar", pack: pack});
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
            "bunny" : "assets/bunny.png",
            "boom" : "assets/boom.png"
        },
        "data" : {
            "map" : "assets/map.csv"    
        }
    }, function() {
        Jxl.state = new SNC.GameState();
        Jxl.start();
    });
} ());