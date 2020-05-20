import {SpatialHash} from '../simulation/spatialHash.js';
import {Vector} from 'matter-js/build/matter.min.js';
import {Tile} from '../simulation/tiles.js'
/**
 * - manages entity spawning/deletion
 */

export class Instancer {
    constructor(particleSystem, stage){
        this.stage =stage;
        // tile collider data structures
        this.tiles = [];
        this.tilePositions = [];
        this.tileSize = 32;

        // box primitive renderer
        this.terrainRenderer = new PIXI.Graphics();
        stage.addChild(this.terrainRenderer);

        // used to line box colliders up with a grid
        this.hash = new SpatialHash(
            this.tileSize, 
            Vector.create(0,0), 
            Vector.create(window.innerWidth, window.innerHeight));
        
        this.particleSystem = particleSystem;
        this.particleSystem.bodies = this.tiles;
    }

    /**
     * @param {number} x - x tile grid coordinate
     * @param {number} y - y tile grid coordinate
     */
    addTile(cursor, drawTile = true, updateFilter = false){
        // check if there's already a tile in the chosen cell
        let gridPos = this.hash.worldToGrid(cursor);
        let existingTile = false;
        for ( let tile of this.tiles ){
            if ( tile.hash.x == gridPos.x && tile.hash.y ==gridPos.y)
                existingTile = true;
        }
        if ( !existingTile) { // add a new tile
           this.addTileAtGrid(gridPos, drawTile);
        }
    }
    
    addTileAtGrid(gridPos,drawTile = true, updateFilter = false){
        let newTile = new Tile(gridPos.x,gridPos.y, this.tileSize);
        if (drawTile)
            newTile.drawRect(this.terrainRenderer);
        else
            newTile.hidden = true;
        this.tiles.push(newTile);
        this.tilePositions.push(newTile.x, newTile.y);
        if ( updateFilter)
            this.stage.filters = [new SdfFilter(this.tilePositions, this.tileSize)];
    }

    eraseTile(cursor){
        let gridPos = this.hash.worldToGrid(cursor);
        for ( let i = 0; i < this.tiles.length; i++ ){
            let tile = this.tiles[i];
            if ( !tile.hidden && tile.hash.x == gridPos.x && tile.hash.y ==gridPos.y){
                this.tiles.splice(i,1);
                this.terrainRenderer.clear();
                for ( let j = 1; j < this.tiles.length; j++){
                    this.tiles[j].drawRect(this.terrainRenderer);
                }
                return;
            }
                
        }
    }

    clearTiles(){
        this.tiles = [];
        this.tilePositions = [];
        this.terrainRenderer.clear();
        this.particleSystem.bodies = this.tiles;

    }

    addParticle(cursor){
        this.particleSystem.addParticle(cursor);
    }

    clearParticles() {
        this.particleSystem.clearParticles();
    }

    clearAll(){
        this.clearTiles();
        this.clearParticles();

        let spawnPoint = new PIXI.Point(92,38);
        
        this.addParticle(spawnPoint);
        this.addTile(spawnPoint, false);     
    }
}