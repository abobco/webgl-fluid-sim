varying vec2 vTextureCoord;
varying vec4 vInputSize;
varying vec4 vOutputFrame;

uniform sampler2D uSampler;

// uniform vec2 particleVerts[size_replacement];
uniform sampler2D position_sampler;
uniform float particleRadius;
uniform int numParticles;
uniform float inv_position_texture_width;
uniform int odd;

#define MERGE_RADIUS 0.05


float circleSDF(vec2 point, float radius){
	float line_resolition = 0.005;	// controls density of the field lines
	float scaled_radius = line_resolition*radius;// scale down the radius to fit the resolution

	vec2 conv_factor = vInputSize.xy*line_resolition;
	vec2 position = (vTextureCoord - point)*conv_factor;

	return length(position) - scaled_radius;

}

// rounds off edges between edges of shapes
float round_merge(float shape1, float shape2, float radius){
	vec2 intersection_space = vec2(shape1 - radius, shape2 - radius);
	intersection_space = min(intersection_space, 0.0);

	float insideDistance = -length(intersection_space);
	float simpleUnion = min(shape1, shape2);
	float outsideDistance = max(simpleUnion, radius);

	return  insideDistance + outsideDistance;
}

float sample_2_positions(int index){
	// sample the pixel
	vec4 sample =  texture2D(position_sampler, vec2(float(index) * inv_position_texture_width, 0.5));

	// compute signed distnaces
	float d1 = circleSDF(sample.rg, particleRadius);
	float d2 = circleSDF(sample.ba, particleRadius);

	// return closest distance
	return round_merge(d1, d2, MERGE_RADIUS);

	// return min(d1, d2);
}

// returns minimum distance from texture coordinate to a surface
float sdf_min() {
	float d = 1000000.0;		
    const int MAX_ITER = size_replacement;
	// int width = int(ceil(float(numParticles) * 0.5));
	int width = numParticles/2 + odd;

	// if ( odd == 1){
	// 	vec4 sample =  texture2D(position_sampler, vec2(1.0, 0.5));
	// 	d = circleSDF(sample.rg, particleRadius);
	// 	--width;
	// }

	for ( int i = 0; i < MAX_ITER; i++){
		if ( i >= width ) break;

		float td = sample_2_positions(i);

		// d = min(td, d);
		d = round_merge(d,td,MERGE_RADIUS);
	}

	return d; 
}

// draw field of lines representing the signed distance field
void main( void )
{
	float d = sdf_min();
    
	// coloring
    vec3 col = vec3(1.0) - sign(d)*vec3(0.1,0.4,0.7);
    col *= 1.0 - exp(-3.0*abs(d));
	col *= 0.8 + 0.2*cos(150.0*d);
	col = mix( col, vec3(1.0), 1.0-smoothstep(0.0,0.01,abs(d)) );

	vec4 sampleColor = texture2D(uSampler, vTextureCoord);

	// if ( sampleColor.r > 0.0)
	// 	gl_FragColor = sampleColor;
	// else	
	gl_FragColor =vec4(col,1.0);

	// gl_FragColor = mix(sampleColor,vec4(col, 1.0), 0.5);
}