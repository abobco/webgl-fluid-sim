import {Vector} from 'matter-js/build/matter.min.js';
var FontFaceObserver = require('fontfaceobserver');


export function readLevel(xml, instancer, sim){
    // open file
    let xmlDoc = xml.responseXML;
    // read tiles
    let x = xmlDoc.getElementsByTagName("tile");
    for (let i = 0; i < x.length; i++) { 
        let position = x[i].childNodes[0].nodeValue.split(" ");
        for ( let j = 0; j < position.length; j++)
            position[j] = parseInt( position[j]);
        let gridPos = Vector.create(position[0], position[1])
        // instance tiles 
        if ( !(gridPos.x == 2 && gridPos.y == 1) )
            instancer.addTileAtGrid(gridPos);
    }
    sim.resetFilter();
     let font = new FontFaceObserver('arcadeclassicregular');
     font.load().then(sim.startApp.bind(sim));   
}

export function serializeLevel(instancer){
    // get tiles
    let tiles = instancer.tiles;
    // serialize tiles
    let tileOutput = [];
    for ( let tile of tiles) {
        tileOutput.push([ tile.hash.x, tile.hash.y]);
    }

    return tileOutput;    
}
