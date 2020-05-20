import vert from './shaders/sdf.vert';
import frag from './shaders/sdf.frag';
/** 
 * Visualization of a 2D box signed distance function (implicit surface) 
 * Implemented as a post processing shader
 * - draws lines parallel to the nearest box surface
 * - shades interior of box blue, outside orange
 * - shades a gradient based off of distance to the nearest box surface 
 *  
 * @class
 * @extends PIXI.Filter
 * @memberof PIXI.filters
 */
export class SdfFilter extends PIXI.Filter
{
    /**
     * 
     * @param {Float32Array} boxPositions 
     * @param {number} tileLength 
     */
    constructor(boxPositions, tileLength)
    {   
        // compile-time constants for dummies
        let vertex = vert.replace(/size_replacement/g, `${boxPositions.length/2}`);
        let fragment = frag.replace(/size_replacement/g, `${boxPositions.length/2}`);

        // compile WebGL shader
        super(vertex, fragment, {
            tilePositions: boxPositions,
            tileSize: tileLength/2.0  , 
            dimensions: [window.innerWidth, window.innerHeight]        
        });
    }

    /**
     * Applies the filter.
     *
     * @param {PIXI.systems.FilterSystem} filterManager - The manager.
     * @param {PIXI.RenderTexture} input - The input target.
     * @param {PIXI.RenderTexture} output - The output target.
     * @param {boolean} clear - Should the output be cleared before rendering to it.
     */
    apply(filterManager, input, output, clear)
    {
        // draw the filter...
        filterManager.applyFilter(this, input, output, clear);
    }

    /**
     * The texture used for the displacement map. Must be power of 2 sized texture.
     *
     * @member {PIXI.Texture}
     */
    get map()
    {
        return this.uniforms.mapSampler;
    }

    set map(value) // eslint-disable-line require-jsdoc
    {
        this.uniforms.mapSampler = value;
    }
}