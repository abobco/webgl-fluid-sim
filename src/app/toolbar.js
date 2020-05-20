import { Instancer } from "./instancer";
import { Tile } from "../simulation/tiles";
import { ParticleSystem } from "../simulation/particle";
import {Vector} from 'matter-js/build/matter.min.js';

export class ToolButton {
    constructor(callback) {
        // this.sprite = new PIXI.Sprite.from(texture);
        this.sprite = new PIXI.Graphics()
            .beginFill(0xf0f0f0)
            .drawRoundedRect(0,0,50,50)
            .endFill();
        this.highLightRect = new PIXI.Graphics()
            .beginFill(0x7896b9)
            .drawRoundedRect(0,0,60,60)
            .endFill();
        this.highLightRect.visible = false;
        this.callback = callback;
        this.active = false;
        this.position = this.sprite.position;

        this.sprite.interactive = true;
        this.sprite.buttonMode = true;

        this.sprite.on('pointerdown', (event) => {
            this.active = true;
            console.log("button press!!");
        });
    }   
}

export class TileButton extends ToolButton {
    /**
     * 
     * @param {function} callback 
     * @param {Instancer} instancer 
     */
    constructor(instancer, callback){
        super(callback, instancer);

        this.inconTile = new Tile(0.5,0.5,24).drawRect(this.sprite);
    }
}

export class ParticleButton extends ToolButton {
    /**
     * 
     * @param {function} callback 
     * @param {Instancer} instancer 
     */
    constructor(instancer, callback){
        super(callback, instancer);
    }
}
export class EraserButton extends ToolButton {
    constructor(instancer, callback){
        super(callback, instancer);
    }
}

export class Toolbar {
    constructor(instancer, UI_Container) {
        this.instancer = instancer;
        this.stage = instancer.stage;
        this.UI_Container = UI_Container;
        this.particleSystem = instancer.particleSystem;

        this.buttons = new Map([
            ["Tile", new TileButton(instancer, cursor => {
               this.instancer.addTile(cursor);
               
            })],
            ["Particle", new ParticleButton(instancer, cursor => {
                this.instancer.addParticle(cursor);
             })],
             ["Eraser", new EraserButton(instancer, cursor => {
                 this.instancer.eraseTile(cursor);
             })]
            ]);
        
        let i = 0;
        let step = 60;
        this.buttons.forEach((button, key) => {
            button.position.set(i*step+10, 10);
            button.highLightRect.position.set(i*step + 5, 5);
            
            this.UI_Container.addChild(button.highLightRect,button.sprite);
            i++
        });

        // this.stage.addChild(this.buttonContainer);

        this.activeButton = "Particle";
        this.buttons.get(this.activeButton).active = true;

        console.log(this.buttons.get(this.activeButton));

        this.callback = this.buttons.get(this.activeButton).callback;    
    }

    update(){
        let newActive = this.activeButton;
        this.buttons.forEach((button, key) => {
            if ( button.active && this.activeButton != key ){
                newActive = key;
               // console.log("new active: ", newActive)
            }
        });

        this.buttons.get(this.activeButton).active = false;
        this.buttons.get(this.activeButton).highLightRect.visible = false;
        this.buttons.get(newActive).active = true;
        this.buttons.get(newActive).highLightRect.visible = true;

        this.activeButton = newActive;

        this.callback = this.buttons.get(this.activeButton).callback;
    }
}