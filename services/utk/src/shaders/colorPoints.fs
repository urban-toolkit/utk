#version 300 es

uniform sampler2D uColorMap;

in highp vec2 texCoords;

// uniform highp vec3 uGlobalColor;

out highp vec4 fragColor;

void main() {

    highp vec3 texColor = texture(uColorMap, texCoords).rgb;

    // highp vec3 light = normalize(vec3(1.0, 1.0, 1.0));

    // highp float diffuse = max(dot(normal, light) * 0.7, 0.0);
    // highp float ambient = 0.25; 
    
    // highp vec3 shade = vec3(1.0, 1.0, 1.0) * (diffuse + ambient); 

    // fragColor = vec4(0.6 * shade + 0.4 * uGlobalColor, 1.0);
    fragColor = vec4(texColor, 1.0);
    // fragColor = vec4(texCoords[0], 0.0, 0.0, 1.0);
}