#version 300 es

uniform highp vec3 uGlobalColor;

in highp vec3 fragNormals;
in lowp float filtered;

out highp vec4 fragColor;

void main() {

  if(filtered <= 0.5){
    fragColor = vec4(0.5,0.5,0.5, 0.7);
  }else{
    highp vec3 light = normalize(vec3(1.0, 1.0, 1.0));
    highp vec3 normal = normalize(fragNormals);

    highp float diffuse = max(dot(normal, light) * 0.7, 0.0);
    highp float ambient = 0.25; 
    
    highp vec3 shade = vec3(1.0, 1.0, 1.0) * (diffuse + ambient); 

    fragColor = vec4(0.6 * shade + 0.4 * uGlobalColor, 1.0);
  }

}