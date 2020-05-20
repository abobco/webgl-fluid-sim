// get shader text with webpack raw-loader
import vert from './shaders/particle.vert';
import frag from './shaders/particle.frag';

/** 
 * 
 * Draw a fluid surface from an array of particle positions
 * 
 * @class
 * @extends PIXI.Filter
 * @memberof PIXI.filters
 */

export class ParticleFilter extends PIXI.Filter {
    constructor(radius, MAX_PARTICLES){
        // compile-time constants for dummies
        let vertex = vert.replace(/size_replacement/g, `${MAX_PARTICLES}`);
        let fragment = frag.replace(/size_replacement/g, `${MAX_PARTICLES}`);

        // compile WebGL shader
        super(vertex, fragment, {
            numParticles: 0,
            particleRadius: radius,
            MAX_PARTICLES: MAX_PARTICLES,
            PositionTexture: [],
            inv_position_texture_width: 0,
            odd: 0
        });
    }
}

/**
 * Writes particle positions to a 1xN texture, to be passed as a uniform to the particle filter.
 * Used to work around a WebGL limit on array uniform sizes for mobile devices
 * 
 * - Writes 2 normalized particle positions onto each texel 
 *  - So for a given texel: (R, G, B, A) = (X1, Y1, X2, Y2)
 * - This texture potentially has to be resized every frame!
 */
export class PositionSampler {
    constructor(max_particles, particleFilter){
        this.max_particles= max_particles;

        // texture representing particle positions
        // passed to the post processing filter
        //this.filterTexture = new PIXI.BaseTexture(null, {width: max_particles, height:1});
        this.filterTexture = new PIXI.RenderTexture.create({width: max_particles, height:1});
        console.log("Max particles: ", max_particles);

        this.particleFilter = particleFilter;

    }

    updateParticles(particle_positions){

       const numParticles = particle_positions.length*0.5;

        if ( particle_positions.length > 0) {       
            let normalized_positions = [];
            let invWindow = [1.0 / window.innerWidth, 1.0/window.innerHeight];      
            for ( let i = 0; i <particle_positions.length; i+=2) {
                normalized_positions.push(
                    particle_positions[i]*invWindow[0],
                    particle_positions[i+1]*invWindow[1]);       
            }
            // writing to a texture, so we need to pass 2 extra values when we have an odd
            // # of particles
            let isOdd = numParticles % 2;
            if ( isOdd ) {
                normalized_positions.push(0.0,0.0); 
            }

            let width = numParticles*0.5 + (isOdd)*0.5; // texture width  
            let buffer = Float32Array.from(normalized_positions); // buffer of normalised pixel rgba values         
            this.filterTexture = new PIXI.Texture.fromBuffer(buffer, width, 1); // WebGL texture

            this.particleFilter.uniforms.inv_position_texture_width = 1.0/width;
            this.particleFilter.uniforms.odd = isOdd;
        } else {
            console.log("No particles to update!");
        }
    }
}