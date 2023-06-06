#version 300 es

uniform sampler2D uColorMap;

in highp vec2 texCoords;
in highp vec3 fragNormals;
in highp vec2 discardFuncInterval; // indicate what pixels to discard based on their function values
in highp float varyOpByFunc;
in lowp float vColorOrPicked;
in lowp float filtered;

out highp vec4 fragColor;

void main() {  
  highp vec3 texColor = texture(uColorMap, texCoords).rgb;

  highp vec3 light = normalize(vec3(1.0, 0.0, 1.0));

  highp vec3 normal = normalize(fragNormals);

  highp float diffuse = max(dot(normal, light) * 0.7, 0.0);
  highp float ambient = 0.25; 
  
  highp vec3 shade = vec3(1.0, 1.0, 1.0) * (diffuse + ambient);

  // texCoords[0] contains the func value for the pixel
  if((discardFuncInterval[0] != -1.0 || discardFuncInterval[1] != -1.0) && (texCoords[0] >= discardFuncInterval[0] && texCoords[0] <= discardFuncInterval[1])){
    discard;
    // fragColor = vec4(texColor, 1.0);
  }else if(filtered <= 0.5){
    fragColor = vec4(0.5,0.5,0.5, 0.7);
  }else{
    // fragColor = vec4(0.6 * shade + 0.64 * texColor, 1.0);
    if(vColorOrPicked > 0.5){
      fragColor = vec4(0,0,1,1);
    }else{
      fragColor = vec4(texColor, 1.0);
    }

    // if(varyOpByFunc > 0.5){
    //   fragColor = vec4(0.6 * shade + 0.64 * texColor, texCoords[0]);
    // }else{
    //   fragColor = vec4(0.6 * shade + 0.64 * texColor, 1.0);
    // }
  }

}