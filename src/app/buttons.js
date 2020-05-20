

export class MyButton {
    /**
     * 
     * @param {string} text - button label text
     * @param {PIXI.Point} position - world coordinates of top left corner of button
     * @param {function()} callback - button click callback function
     */
    constructor(text, position, callback){          
        const style = {
            fill: 0x000000,
            fontSize: 32,
            fontFamily: 'arcadeclassicregular'
        }   
        const padding = new PIXI.Point(5, 10); // how many CSS units to offset the text
        this.textDisplay = new PIXI.Text(text, style); // TTF font display object

        // bounding box for the button
        const rect = new PIXI.Rectangle(
            position.x, position.y, //position
            this.textDisplay.width+2*padding.x, //width
            this.textDisplay.height+2*padding.y ) //height

        
        this.textDisplay.position.set(rect.x+ padding.x, rect.y +padding.y);

        this.displayContainer = new PIXI.Container();
        this.buttonRenderer = new PIXI.Graphics();
        this.buttonRenderer.interactive = true;
        this.buttonRenderer.buttonMode = true;

        this.buttonRenderer.beginFill(0xFFFFFF, 1)
            .drawRoundedRect(rect.x, rect.y, rect.width, rect.height)
            .endFill();
        this.buttonRenderer.on("pointerdown", callback);

        this.displayContainer.addChild(this.buttonRenderer);
        this.displayContainer.addChild(this.textDisplay);
    }
}