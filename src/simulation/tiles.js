import {Vector} from 'matter-js/build/matter.min.js';
import {SpatialHash} from './spatialHash.js'

/**
 * combines tiles into rectangles for particle collisions
 */
 export class TileMap{
     constructor(tiles){
        this.tiles = tiles;
        
        let w, h = 0;

        for ( let tile of tiles){
            if ( tile.x + r > w)
                w = tile.x;
            if ( tile.y + r > h)
                h = tile.y;
        }   
        this.dimensions = Vector.create(w,h);

        this.hash = new SpatialHash(tiles[0].r, Vector.create(0,0), this.dimensions);     
     }
 }   

/** 
 * - Colliders for kinematics 
 */
export class Tile {
    /**
     * @param {number} x 
     * @param {number} y 
     * @param {number} s 
     */
    constructor(x,y,s){
        this.fillColor = 0x370b8a;
        this.lineColor = 0xFFFFFF;

        this.r = s*0.5;
        this.x = x * s + this.r;
        this.y = y * s + this.r;
        this.hash = Vector.create(x,y);
        this.s = s;
        this.width = s;
        this.height = s;

        this.position = Vector.create(this.x,this.y);

        this.hidden = false;

        // physics collider
        // this.body = new Matter.Bodies.rectangle(this.x,this.y,s,s,{ isStatic : true });
    }
    /** Draw rect given input PIXI Graphics object
     *  @param {PIXI.Graphics} graphics - tile renderer
     */ 
    drawRect(graphics) {
        // draw collision box rectangle
        graphics
            .lineStyle(2, this.lineColor, 1)
            .beginFill(this.fillColor, 1)
            .drawRect( this.x - this.r, this.y - this.r, this.s, this.s )
            .endFill();
    }
}