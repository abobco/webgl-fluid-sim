varying vec2 vTextureCoord;
varying vec4 vInputSize;
varying vec4 vOutputFrame;

uniform sampler2D uSampler;
uniform sampler2D position_sampler;
uniform vec2 dimensions;
// uniform vec2 tilePositions[size_replacement];
uniform float tileSize;
uniform float resolution;

uniform vec4 inputPixel;

// box sdf function
float sdBox( vec2 point, vec2 radius ) {
	point*=vInputSize.xy * 0.001;
	radius*=vInputSize.xy * 0.001;

    vec2 d = abs(point)-radius;
    return length(max(d,0.0)) + min(max(d.x,d.y),0.0);
}

// returns minimum distance from texture coordinate to a surface
float sdfDistance() {
	float d = 1000000.0;
	float line_resolition = 8.0;

	for ( int i = 0; i < size_replacement; i++){
		vec2 point =vTextureCoord -  texture2D(position_sampler, i / float(size_replacement)).xy; 
		point *= line_resolition;
		//vec2 point = line_resolition*(vTextureCoord - tilePositions[i]*vInputSize.zw);
		float td = sdBox(point, line_resolition*vec2(tileSize)*vInputSize.zw);

		d = min(td, d);
	}
	return d; 
}

// draw field of lines representing the signed distance field
void main( void )
{
	float d = sdfDistance();
    
	// coloring
    vec3 col = vec3(1.0) - sign(d)*vec3(0.1,0.4,0.7);
    col *= 1.0 - exp(-3.0*abs(d));
	col *= 0.8 + 0.2*cos(150.0*d);
	col = mix( col, vec3(1.0), 1.0-smoothstep(0.0,0.01,abs(d)) );

	gl_FragColor = mix(vec4(col,1.0), texture2D(uSampler, vTextureCoord), 0.5);
}