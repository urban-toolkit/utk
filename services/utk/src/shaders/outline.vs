#version 300 es

const float pi = 3.1415926535897932384626433832795;
const float pi_180 = 0.017453292519943295769236907684886127134428718885417254560;
const float pi_4   = 12.56637061435917295385057353311801153678867759750042328389;

uniform highp mat4 uModelViewMatrix;
uniform highp mat4 uProjectionMatrix;
uniform highp vec2 uWorldOrigin;

in highp vec3 vertCoords;
in highp float cornerValues;
in highp float inWallWidth;
in highp float inSectionHeight;
in highp float inHeightInSection;
in lowp float inFiltered; // Indicates if a pixel is filtered in or out

out highp float cornerBool;
out highp float wallWidth;
out highp float surfaceHeight;
out highp float heightInSection;
out lowp float filtered;

void main() {
  highp vec3 finalPos = vertCoords;

  cornerBool = cornerValues;
  wallWidth = inWallWidth;
  surfaceHeight = inSectionHeight;
  heightInSection = inHeightInSection;
  filtered = inFiltered;

  gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(finalPos, 1.0);
}