import {Vector} from 'matter-js/build/matter.min.js';
import { SpatialHash } from './spatialHash';

export class ParticleEmitter{
    constructor(particleSystem, position){
        this.particleSystem = particleSystem;
        this.position = Vector.clone(position);
        this.angle = 0;
        this.angleInc = 0.05;
        this.spawnVel = 2;
    }

    update(){
        this.angle+= this.angleInc;
        let spawnDir = Vector.create(Math.cos(this.angle), Math.sin(this.angle));

        this.particleSystem.addParticle(this.position, Vector.mult(spawnDir, this.spawnVel));
    }
}

/**
 * Individual particle base class
 * @class
 */
export class Particle{
    /**
     * @param {PIXI.Point} spawnPoint
     */
    constructor(spawnPoint, velocity){
        this.dimensions = new PIXI.Point(10,10);
        this.r = 5;
        this.position = Vector.create(spawnPoint.x, spawnPoint.y);
        this.o = Vector.create(spawnPoint.x, spawnPoint.y);
        this.f = Vector.create(0,0);
        this.isNew = true;
        if (velocity)
            this.velocity = Vector.clone(velocity)
        else
            this.velocity = Vector.create(0,0);
        this.density = 0;
        this.nearDensity = 0;
        this.ticks = 60;      
    }
}

import physics_config from '../fluid_config.json'
/**
 * draws the array of particles
 */
 export class ParticleSystem {
     constructor( min, max, bodies, bounds = PIXI.Rectangle(window.innerWidth*0.5, window.innerHeight*0.5, window.innerWidth, window.innerHeight)){       
         this.bodies = bodies;
         this.min = Vector.clone(min);
         this.max = Vector.clone(max);

         this.particles = [];
         this.nearParticlesCache = [];  // used to avoid duplicate particle neighbor queries
         this.particlePositions = [];
        
         // not using this anymore, but used it for debugging at the start of development
         this.renderer = new PIXI.Graphics();  
         this.particleCount = 0;

         console.log(physics_config);   // physics constants loaded from json
         this.gravity = physics_config.gravity;
        // near/far interaction radius
         this.r = physics_config.particle_radius;
         this.h = physics_config.interaction_radius;
        // density constants
         this.stiffness = physics_config.stiffness;
         this.nearStiffness = physics_config.near_stiffness;
         this.restDensity = physics_config.rest_density;   
         // viscosity constants
         this.sigma = physics_config.sigma;
         this.beta = physics_config.beta;

         this.PARTICLE_LIMIT = physics_config.particle_limit;

         this.hash = new SpatialHash(this.h, min, max);

         this.containerBounds = new PIXI.Rectangle(window.innerWidth*0.5, window.innerHeight*0.5, window.innerWidth, window.innerHeight);
        //  this.renderer.beginFill(0xbc42f5, 0.5)
        //     .drawRect(
        //         this.containerBounds.x - this.containerBounds.width*0.5, 
        //         this.containerBounds.y - this.containerBounds.height*0.5, this.containerBounds.width, this.containerBounds.height)
     }

     update(){
         this.nearParticlesCache = [];

         this.clearOOB();
         
         this.removeDeadParticles();

         this.hash.update(this.particles);
         
         for ( let i = 0; i < this.particles.length; i++) {
            let iParticle = this.particles[i];
            iParticle.position = Vector.add(iParticle.position, iParticle.f);

            iParticle.f.x =0;
            iParticle.f.y =0;
            iParticle.nearDensity = 0;
            iParticle.density = 0;

            // prediction-relaxation scheme from the paper
            if (!iParticle.isNew)
                iParticle.velocity = Vector.sub(iParticle.position, iParticle.o);
            iParticle.isNew = false;

            // apply gravity
            iParticle.velocity.y += this.gravity

            this.viscosityImpulses(i, 1.0);          
         }

         for (  let i = 0; i < this.particles.length; i++){
             let iParticle = this.particles[i];
             iParticle.o = Vector.clone(iParticle.position);
             iParticle.position = Vector.add(iParticle.position, iParticle.velocity);

             this.computeDensities(i);
             this.handleCollision(iParticle);
         }

         // algorithm 2 from the paper
         this.doubleDensityRelaxation(1.0);

         this.updateParticlePositions()
     }

     clearOOB(){
         for ( var i =0; i < this.particles.length; ++i){
             let iParticle = this.particles[i];
             let p = iParticle.position;

             if( p.x < this.min.x || p.y < this.min.y || p.x >= this.max.x || p.y >= this.max.y ){
                 this.particles.splice(i,1);
                 this.particlePositions.splice(i*2, 2);
                 --i;
                 --this.particleCount;
             }
         }
     }

     viscosityImpulses(i, delta){
         let iParticle = this.particles[i];

         let nearParticles = this.hash.getNeighbors(iParticle);

         this.nearParticlesCache[i] = nearParticles;

         for ( let jParticle of nearParticles){
             let dp = Vector.sub(iParticle.position, jParticle.position);
             let r2 = Vector.dot(dp, dp);

             if (r2 <= 0.0 || r2 > this.h * this.h)
                continue;

            
            let r = Math.sqrt(r2);

            let normalized_r = Vector.normalise(dp);

            let one_minus_q = 1 - r / this.h;

            let vi_minus_vj = Vector.sub(iParticle.velocity, jParticle.velocity);

            let u = Vector.dot(vi_minus_vj, normalized_r);

            let t = 0;
            if ( u > 0 ){
                t = delta * one_minus_q * (this.sigma * u + this.beta * u * u) * 0.5;
                if ( t > u)
                    t = u;
            } else {
                t = delta * one_minus_q * (this.sigma * u - this.beta * u * u) * 0.5;
                if  (t < u )
                    t = u;
            }

            let i_div2 = Vector.mult(normalized_r, t);

            iParticle.velocity = Vector.add(iParticle.velocity, Vector.mult(i_div2, -1));
            jParticle.velocity = Vector.add(jParticle.velocity, Vector.mult(i_div2, 1));

         }
     }

     computeDensities(i){
         let nearParticles = this.nearParticlesCache[i];
         let iParticle = this.particles[i];

         for ( let jParticle of nearParticles){
            let dp = Vector.sub(iParticle.position, jParticle.position);

            let r2 = Vector.dot(dp,dp);

            if ( r2 <= 0 || r2 > this.h*this.h)
                continue;
            
            let r = Math.sqrt(r2);
            let a = 1 - r / this.h;
            let aa = a*a;
            let aaa = aa*a;
            
            iParticle.density += aa;
            jParticle.density += aa;

            iParticle.nearDensity += aaa;
            jParticle.nearDensity += aaa;
         }
     }

     doubleDensityRelaxation(delta) {
        for ( let i =0; i < this.particles.length; i++){
            let iParticle = this.particles[i];

            let pressure = this.stiffness*(iParticle.density - this.restDensity);
            let nearPressure = this.nearStiffness* iParticle.nearDensity;

            let nearParticles = this.nearParticlesCache[i];

            for ( let jParticle of nearParticles){
               let dp = Vector.sub(iParticle.position, jParticle.position);
               let r2 = Vector.dot(dp,dp);

               if ( r2 <= 0.0 || r2 > this.h*this.h)
                    continue;
                let r = Math.sqrt(r2);
                let a = 1 - r/this.h;

                let d = delta*delta*(pressure*a+nearPressure*a*a)*0.5;
                let da = Vector.mult(dp, d/r);
                iParticle.f = Vector.add(iParticle.f, Vector.mult(da,1));
                jParticle.f = Vector.add(jParticle.f, Vector.mult(da,-1));
            }

        }
     }

     handleCollision(particle){
        // handle all particle-static body collisions
        for ( let body of this.bodies ) { 
            this.boxCollision(particle, body); 
        }

        // handle box container collision for screen bounds
        this.boxCollision(particle, this.containerBounds, true);
     }

     boxCollision(particle, box, isContainer = false) {
        // we must either add or subtract the particle radius from the signed distance
        // depending on if the box is a container or not
         let sign = -1;
         if ( isContainer )
            sign = 1;
        
        // convert particle position to local box coordinates
        let x = particle.position;
        let c = Vector.create(box.x, box.y);      
        let xLocal = Vector.sub(x,c);

        // map the particle's position to quadrant 1 of the box's axes
        let xAbs = Vector.create(Math.abs(xLocal.x), Math.abs(xLocal.y));
        let r = Vector.create(box.width*0.5,box.height*0.5)
        let d = Vector.sub(xAbs, r)

        // compute signed distance
        let sd =  Vector.magnitude(Vector.create(Math.max(d.x, 0), Math.max(d.y,0)))
        + Math.min(Math.max(d.x, d.y), 0) + this.r*sign;

        // handle collision
        if ( isContainer && sd >= 0 || !isContainer && sd <= 0 ) {
            // calculate local contact point
            let cpLocal = Vector.create(
                Math.min(r.x, Math.max(-r.x, xLocal.x)),
                Math.min(r.y, Math.max(-r.y, xLocal.y))
            );
            
            // calculate surface normal 
            let n = Vector.create(Math.sign(cpLocal.x - xLocal.x), Math.sign(cpLocal.y - xLocal.y));
            n = Vector.normalise(n);
            
            // decompose particle velocity into normal/tangential velocity to the surface
            let velTangent = Vector.mult(n, Vector.dot(particle.velocity, n));
            let velNormal = Vector.sub(particle.velocity, velTangent);
            
            // apply friction to tangential velocity
            velTangent = Vector.mult(velTangent, 0.5);
            
            // remove particle's normal velocity
            particle.velocity.x = velTangent.x;
            particle.velocity.y = velTangent.y;

            // add to particle's impulse buffer
            particle.f = Vector.add( particle.f, Vector.neg(Vector.sub(velNormal, Vector.mult(velTangent, 0.01))));
            
            // apply translation to particle
            if ( !isContainer ) // tile collisions require a different translational response
                particle.position = Vector.add(particle.position, Vector.mult(n, sd));
            else 
                particle.position = Vector.add(c, cpLocal);
        }

     }

     removeDeadParticles(){
         let deadParticles = this.particleCount - this.PARTICLE_LIMIT;

         if ( deadParticles > 0 ){
             // don't remove the first 2 particles
             // because they are used for the toolbar icon!
            this.particles.splice(2, deadParticles);
            //console.log(this.particles[0].position.x, this.particles[0].position.y)
            //this.particleCount -= deadParticles;

            //this.particlePositions.splice(5, deadParticles*2);
            //console.log("Particle Count: ", this.particleCount);
         }
     }

     updateParticlePositions(){
         this.particlePositions = [];
         this.particleCount = this.particles.length;

         for (let particle of this.particles ){
             this.particlePositions.push(particle.position.x, particle.position.y);
         }
     }

     /**
      * 
      * @param {PIXI.Point} position 
      * @param {number} velocity
      */
     addParticle(position, velocity ){
         let newParticle1 = new Particle(position, velocity);
         let newParticle2 = new Particle(Vector.create(position.x+0.1, position.y),velocity);
         this.particlePositions.push(newParticle1.position.x, newParticle1.position.y, newParticle2.position.x, newParticle2.position.y);
         this.particles.push(newParticle1, newParticle2);
         this.particleCount+= 2;
     }

     clearParticles() {
         this.particles = [];
         this.particlePositions = [];
         this.particleCount = 0;
     }
 }

