import {Vector} from 'matter-js/build/matter.min.js';
/**
 * Implements spatial hashing to quickly find the neighbors of a particle
 * within support radius h
 * @class
 */
 export class SpatialHash{
    /**
     * Implements spatial hashing to quickly find the neighbors of a particle
     * within support radius h
     * @param {number} h - particle interaction radius
     * @param {Vector} min 
     * @param {Vector} max 
     */
    constructor(h, min, max){
        // interaction radius
        this.h = h;
        this.min = Vector.clone(min);
        this.max = Vector.clone(max);

        this.size = Vector.create( Math.ceil( (this.max.x - this.min.x) / this.h),
                                   Math.ceil( (this.max.y - this.min.y) / this.h));

        // init grid
        this.grid = [];
    }

    /** Transform from world coordinates to grid coordinates */
    worldToGrid(position){
        return Vector.create(
            Math.floor(position.x/this.h),
            Math.floor(position.y/this.h));
    }

    /** Transforms from grid coordinates to grid array index */
    gridToIndex(gridPosition){
        return gridPosition.y * this.size.x + gridPosition.x;
    }

    /** clear and refill grid with new particle arrays */
    update(particles){
        // init grid
        let count = 0;
        for ( let i =0; i < this.size.x*this.size.y; i++){
            this.grid[i] = [];
            ++count;
        }
        
        for (let particle of particles){
            let gridPosition = this.worldToGrid(particle.position)
            let index = this.gridToIndex(gridPosition);
            this.grid[index].push(particle);
        }
    }

    /** returns array of particles within interaction radius */
    getNeighbors(particle) {
        // bounding box containing the interaction radius
        let bbMin = this.worldToGrid(Vector.create(particle.position.x - this.h, particle.position.y - this.h));
        let bbMax = this.worldToGrid(Vector.create(particle.position.x + this.h, particle.position.y + this.h));

        let nearParticles = [];

        // iterate overall grid cells near the particle,
        // add particles within the interaction radius
        for ( let x = bbMin.x; x <= bbMax.x; x++){
            for (let y = bbMin.y; y <= bbMax.y; y++){
                // check for world bounds
                if( x < 0 || y < 0 || x >= this.size.x || y >= this.size.y )
                    continue;
                
                let cellParticles = this.grid[this.gridToIndex(Vector.create(x,y))];
                for ( let p of cellParticles ) {
                    let d = Vector.magnitudeSquared(Vector.sub(particle.position, p.position));
                    if (d < this.h*this.h)
                        nearParticles.push(p);
                }

            }
        }
        return nearParticles;
    }
 }