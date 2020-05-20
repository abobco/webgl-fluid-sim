precision highp float;
uniform float MAX_PARTICLES;
uniform vec2 dimensions;

attribute vec2 aVertexPosition;
attribute vec2 aParticlePosition;

varying vec2 vParticlePosition;


void main() {
    gl_Position = vec4(aVertexPosition.x/MAX_PARTICLES, 0.5, 1.0, 1.0);

    vParticlePosition = aParticlePosition/dimensions;

}

