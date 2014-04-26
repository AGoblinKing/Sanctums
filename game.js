(function() {
    "use strict";
    
    var width = document.body.width,
        height = document.body.height,
        Sanctums = {},
        game = new Phaser.Game(
            width, 
            height, 
            document.body.querySelector("canvas"), 
            "sanctums",
            {
                preload : function() {
                    console.log(this);
                    game.load.image("ground_1x1", "assets/tile.png");
                },
                create : function() {
                    Sanctums.map = game.add.tilemap();
                    Sanctums.map.addTilesetImage("ground_1x1");
                    Sanctums.map.create("sanctum");
                },
                update : function() {

                },
                render : function() {

                }
            });
        
        
    
    
    
} ());
