#version 300 es

uniform highp vec3 uGlobalColor;

out highp vec4 fragColor;

void main() {  
  fragColor = vec4(uGlobalColor, 1.0);
}