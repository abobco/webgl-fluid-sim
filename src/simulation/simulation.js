import {Vector} from 'matter-js/build/matter.min.js';
import { ParticleSystem, ParticleEmitter } from "./particle.js";
import {MyButton} from '../app/buttons.js'
import { ParticleFilter, PositionSampler } from "../graphics/particleFilter.js";
import { Toolbar } from "../app/toolbar.js";
import { Instancer } from "../app/instancer.js";

import { readLevel, serializeLevel} from '../network/serialization';
import {getOS, getBrowser} from '../network/getOS.js';
import {getRandomLevel} from '../network/getLevel.js';

/**
 * Controls fluid simulation and timestep
 */
export class Simulation{
    /**
     * 
     * @param {PIXI.Application} app 
     */
    constructor(app){
        this.app = app;
        this.updateLag = 0; // used for fixed update loop

        // map settings
        this.mapDimensions = new PIXI.Point(16,16);
        this.tileSize = 32;
        this.frameCount = 0; // calculate fps   
        this.level_loaded = false;

        // empty container to render the particle filter
        this.particleContainer = new PIXI.Container();

        // holds display objects for UI
        this.UI_Elements = new PIXI.Container(); 
        this.UI_Elements.alpha = 0.5

        // mouse input for particle spawning
        this.mouseDown = false;
        this.cursor = this.app.renderer.plugins.interaction.mouse.global;
        if ( "ontouchstart" in document.documentElement ) {
            this.cursor = new PIXI.Point();
        }

        this.initEventListeners();

        // draws and updates particle positions
        this.particleSystem = new ParticleSystem(
            Vector.create(-100,-100), 
            Vector.create(window.innerWidth+100, window.innerHeight+100),
            []);

        this.emitters = [];

        this.app.stage.addChild(this.particleContainer);
        
        // handles all tile/particle spawns/despawns
        this.instancer = new Instancer(this.particleSystem, this.app.stage);
  
        // used to label a UI button, this should probably get moved somewhere else
        let spawnPoint = new PIXI.Point(92,38);
        this.instancer.addTile(spawnPoint, false);
        this.instancer.addParticle(spawnPoint);

        // sdf shader effect for the particles
        this.particleFilter = new ParticleFilter(
            this.particleSystem.r, 
            this.particleSystem.PARTICLE_LIMIT);
        
        this.sdfTexture = new PositionSampler(this.particleSystem.PARTICLE_LIMIT, this.particleFilter);
        this.sdfTexture.updateParticles(this.particleSystem.particlePositions);
        
        // this.emitters.push(new ParticleEmitter(this.particleSystem,Vector.create(100,100)));

        this.particleContainer.filterArea = this.app.screen;
        this.particleContainer.filters = [this.particleFilter];

        // make tile colliders & add to physics engine
        this.initWorldBounds();

    }

    /** 
     * - add display objects to stage
     * - apply filters
     * - start the game loop
     */
    startApp(){
        this.initUI();
        this.app.stage.addChild(
            this.particleSystem.renderer,
            this.UI_Elements);         
        //console.log(PIXI.loader.resources['sprites/eraser.png']);       

        // this is causing problems with async requests on mobile      
        this.app.ticker.add(delta => this.update(delta));
    }

    /** Called at the end of every animation frame */
    update(delta){
        this.frameCount++;
        //console.log(this.particleSystem.particles[this.particleSystem.particleCount-1].position);

        // this.particleFilter.uniforms.position_sampler = this.sdfTexture.filterTexture;
        // this.particleFilter.uniforms.numParticles = this.particleSystem.particleCount;
        this.FixedUpdate();

        // this.sdfTexture.updateParticles(this.particleSystem.particlePositions);

       // this.updateUI();
       this.toolbar.update();
        
        // spawn collider tiles on right click
        if ( this.rightMouseDown){
            this.instancer.addTile(this.cursor);
        }
    }

    
    /** Updates at 60 Hz constant */
    FixedUpdate(){
        // this has to be inside this function or else we get particle flickers occasionally during spawns
        // keeping it outside the fixed timestep loop b/c we still only need 1 texture/uniform update per frame

        this.updateLag += this.app.ticker.deltaMS;
        while ( this.updateLag >= 16.666 ) {  
            this.updateLag -= 16.666 // move forward one time step
            for ( let emitter of this.emitters )
                emitter.update();
            // spawn entities
            
            this.particleFilter.uniforms.position_sampler = this.sdfTexture.filterTexture;
            this.particleFilter.uniforms.numParticles = this.particleSystem.particleCount;
            this.sdfTexture.updateParticles(this.particleSystem.particlePositions);

            if ( this.mouseDown ){
                let point_in_ui = false;
                for ( let child of this.UI_Elements.children){
                    if (this.app.renderer.plugins.interaction.hitTest(this.cursor, child))
                        point_in_ui = true;
                }
                if (!point_in_ui)
                    this.toolbar.callback.call(this, this.cursor);
            }            
            this.particleSystem.update();
            
        }
    }

    initWorldBounds(){             

        let instanceFromXML = (xml) =>{
            readLevel(xml, this.instancer, this);
            // this.level_loaded = true;
            // wait for fonts to load before making ui and starting game loop
            //this.startApp();
            
        // let font = new FontFaceObserver('arcadeclassicregular');
        // font.load().then(this.startApp.bind(this));    
        }

        // LoadXML(instanceFromXML, "6.xml");
        getRandomLevel(instanceFromXML);
    }

    updateUI(){
        this.ParticleCountDisplay.text = `PARTICLES: ${this.particleSystem.particleCount}`;
        //this.TileCountDisplay.text = `TILES: ${this.tiles.length}`;
        
        if ( this.frameCount % 10 == 0 ){
            const fps = Number.parseFloat(1.0 / (this.app.ticker.deltaMS * 0.001)).toFixed(2);
            this.FPSDisplay.text = `FPS: ${fps}`
            this.frameCount = 1;
        }
    }

    initUI(){
        // object spawning toolbar   
        this.toolbar = new Toolbar(this.instancer, this.UI_Elements );

        // black & white font styles
        const style = {
            fill: 0xffffff,
            fontSize: 32,
            fontFamily: 'arcadeclassicregular'
        }; 
        
        //const xOffset = this.tileSize * this.mapDimensions.x + this.tileSize;
        const xOffset = window.innerWidth - 250;
        
        // FPS & Particles counters
        // this.FPSDisplay = new PIXI.Text(`FPS: ${0}`, style);
        // this.ParticleCountDisplay = new PIXI.Text(`PARTICLES: ${this.particleSystem.particleCount}`, style);     
        //this.TileCountDisplay = new PIXI.Text(`TILES: ${this.particleSystem.particleCount}`, style);
        
        // this.FPSDisplay.position.set( xOffset,this.tileSize);
        // this.ParticleCountDisplay.position.set( xOffset, this.tileSize * 2 ); 
        //this.TileCountDisplay.position.set( xOffset, this.tileSize * 6 );
        
        this.clearButton = new MyButton(
            'CLEAR',
            // new PIXI.Point(xOffset ,this.tileSize*3),
            new PIXI.Point(window.innerWidth - 105, 10),
            this.instancer.clearAll.bind(this.instancer));
            
            // saves a level to the database when pressed
            this.saveButton = new MyButton(
                'SAVE',
                new PIXI.Point(window.innerWidth - 190, 10),
                () =>{
                    // prompt the user to name their level
                    var text_input = prompt("name your level, punk", "blob co");
                    if (text_input){
                        console.log("level name: ",text_input);
                        // send the level data to the server, where it is written to XML & saved to the mysql database
                        $.post('php/add_level.php', 
                        {
                            time: new Date().toLocaleTimeString(),
                            OS: getOS(),
                            browser: getBrowser(),
                            name: text_input,
                            tiles: serializeLevel(this.instancer)
                        },
                        function(data, status){
                            console.log("Data: " + data + "\nStatus: " + status);
                        })
                    }
                    else {
                        console.log("User cancelled the prompt.");
                    }
                }
            )
        // getLevels();
        
        this.UI_Elements.addChild(//this.FPSDisplay, 
                                  // this.ParticleCountDisplay,
                                  //this.TileCountDisplay, 
                                  this.clearButton.displayContainer,
                                  this.saveButton.displayContainer);
                                  //this.tileClearButton.displayContainer);

       
    }
    resetFilter() {
        this.particleFilter = new ParticleFilter(
            this.particleSystem.r, 
            this.particleSystem.PARTICLE_LIMIT);
        
        this.sdfTexture = new PositionSampler(this.particleSystem.PARTICLE_LIMIT, this.particleFilter);
        this.sdfTexture.updateParticles(this.particleSystem.particlePositions);

         
        this.particleContainer.filterArea = this.app.screen;
        this.particleContainer.filters = [this.particleFilter]; 
    }

    initEventListeners(){
        window.addEventListener("mousedown", event => {
            switch (event.button){
                case 0: this.mouseDown = true;
                    break;
                case 2: this.rightMouseDown = true;
                    break;
            }
        });
        window.addEventListener("mouseup", event => {
            switch (event.button){
                case 0: this.mouseDown = false;
                    break;
                case 2: this.rightMouseDown = false;
                    break;
            } 
        });
        window.addEventListener( 'resize', this.onWindowResize.bind(this), false );

        window.addEventListener('touchstart', event => {
            this.mouseDown = true;
            this.cursor.set(event.touches[0].clientX, event.touches[0].clientY);
        });
        window.addEventListener('touchmove', event => {
            this.cursor.set(event.touches[0].clientX, event.touches[0].clientY);
        });
        window.addEventListener('touchend', () => {
            this.mouseDown = false;
        });
        document.getElementById('myCanvas').oncontextmenu = function (e) {
            e.preventDefault();
        };

        window.addEventListener("keydown", event => {
            if ( event.keyCode == 32){
                this.resetFilter(); 
            }
        })
    }

    onWindowResize() {
        // Get canvas parent node
        const parent = this.app.view.parentNode;
        
        // Resize the renderer
        this.app.renderer.resize(parent.clientWidth, parent.clientHeight);
    }
}