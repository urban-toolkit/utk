#version 300 es

uniform highp sampler2D u_texture; 

in highp vec2 texCoords;

out highp vec4 fragColor;

void main() {  
  fragColor = texture(u_texture, texCoords);
  // if(fragColor == vec4(1,1,1,1)){ 
  if(fragColor == vec4(0,1,0,1)){ 
    discard;
  }
}