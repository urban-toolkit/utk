#version 300 es

uniform sampler2D uColorMap;

uniform highp sampler2D u_texture; 

in highp vec2 texCoords;
in highp vec3 fragNormals;
in lowp float vColorOrPicked;
in highp float footprintPlaneHeight; // the height of the footprint attached to the building to which this fragment belong
in highp vec3 vsCoords;
in lowp float filtered;

out highp vec4 fragColor;

void main() {  

  // Using discrete values =========================================

  // highp vec3 texColor;

  // highp vec3 light = normalize(vec3(1.0, 0.0, 1.0));
  // highp vec3 normal = normalize(fragNormals);

  // highp float diffuse = max(dot(normal, light) * 0.7, 0.0);
  // // highp float ambient = 0.25;
  // highp float ambient = 0.6; 

  // if(texCoords[0] <= 0.5){
  //   // fragColor = vec4(0,0,0,1);
  //   texColor = vec3(127,127,127);
  // }else if(texCoords[0] >= 0.5 && texCoords[0] < 1.5){
  //   // fragColor = vec4(1,0,0,1);
  //   texColor = vec3(255,127,0);
  // }else if(texCoords[0] >= 1.5 && texCoords[0] < 2.5){
  //   // fragColor = vec4(0,0,1,1);
  //   texColor = vec3(55,126,184);
  // }else if(texCoords[0] >= 2.5 && texCoords[0] < 3.5){
  //   // fragColor = vec4(0,1,0,1);
  //   texColor = vec3(77,175,74);
  // }else{
  //   // fragColor = vec4(1,1,0,1);
  //   texColor = vec3(152,78,163);
  // }

  // highp vec3 shade = texColor * (diffuse + ambient);
  // fragColor = vec4(shade/255.0, 1);
  
  // ================================================================

  highp vec3 texColor = texture(uColorMap, texCoords).rgb;

  highp vec3 light = normalize(vec3(1.0, 0.0, 1.0));
  highp vec3 normal = normalize(fragNormals);

  highp float diffuse = max(dot(normal, light) * 0.7, 0.0);
  highp float ambient = 0.25; 
  // highp float ambient = 0.6; 
  
  // highp vec3 shade = vec3(1.0, 1.0, 1.0) * (diffuse + ambient);
  highp vec3 shade = texColor * (diffuse + ambient);

  if(filtered <= 0.5){
    fragColor = vec4(0.5,0.5,0.5, 0.7);
  }else{
    if(vColorOrPicked > 0.5){ // the pixel was picked (0.5 is used to account for imprecisions in the interpolation)
      // fragColor = vec4(0,0,1,1);
      fragColor = vec4(0,1,0,1);
    }else{
      if(footprintPlaneHeight >= 0.0 && vsCoords[2] >= footprintPlaneHeight){ // <0 indicates that there is no footprint plane attached to the building
        // fragColor = vec4(0.6 * shade + 0.64 * texColor, 0.3);
        fragColor = vec4(1,1,1,0.3);
        // discard;
      }else{
        // texColor = vec3(0.875,0.875,0.875);
        fragColor = vec4(0.6 * shade + 0.4 * texColor, 1);
        // fragColor = vec4(shade, 1);
        // fragColor = vec4(texColor, 1);
      }
    }
  }

}