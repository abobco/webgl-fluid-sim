import { Simulation } from "./simulation/simulation.js";
import {MyLoader} from './app/myLoader.js';

let app;
let simulation;

InitPixi();

//let loader = new MyLoader(InitPixi)

/** make webgl/canvas renderer */ 
function InitPixi() {
  //PIXI.settings.PREFER_ENV = PIXI.ENV.WEBGL

  app = new PIXI.Application({ 
    width: window.innerWidth, 
    height: window.innerHeight,                       
    antialias: true, 
    transparent: false, 
    resolution: 1,
    backgroundColor: 0x000000 ,
    autoDensity: true
  });

  // Fit the canvas to the window
  app.renderer.view.style.position = "absolute";
  app.renderer.view.style.display = "block";
  // Add the canvas to the document
  document.getElementById('myCanvas').appendChild(app.view);

  simulation = new Simulation(app);
}