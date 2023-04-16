#version 300 es

in highp float cornerBool;
in highp float wallWidth;
in highp float surfaceHeight;
in highp float heightInSection;
in lowp float filtered;

out highp vec4 fragColor;

void main() {  

  if(filtered <= 0.5){
    discard;
  }else{
    if(cornerBool >= -0.1 && ((cornerBool <= 0.4 || cornerBool >= (wallWidth - 0.4)) || (heightInSection <= 0.4 || heightInSection >= (surfaceHeight - 0.4)))){
      fragColor = vec4(0,0,0,1);
    }else{
      // fragColor = vec4(0,0,0,0);
      discard;
    }
  }

}