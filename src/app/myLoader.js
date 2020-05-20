// Aliases
let loader = PIXI.loader,
    resources = loader.resources;

export class MyLoader{
    constructor(setupFunction) {

        loader
            .add('ARCADECLASSIC', 'fonts/ARCADECLASSIC.TTF')
            .add('sprites/eraser.png')
            .load(this.onLoad.bind(this, setupFunction));
    }

    onLoad(setupFunction){
        this.menuFont = resources.ARCADECLASSIC;

        setupFunction(this);
    }
}