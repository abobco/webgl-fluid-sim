/**
 * generic button with a callback function.
 * intended for use in a scrolling list
 * 
 * 
 */

class ListElement{
    constructor(displayObject, callback){
        this.displayObject = displayObject;
        this.displayObject.on("pointerdown", callback);
        this.displayObject.interactive = true;
        this.displayObject.buttonMode = true;
    }
}

/**
 * Vertical List of buttons. Scrolls with mousewheel or swipe events
 * 
 */
export class MenuList {
    constructor(options){
    }
}