#version 300 es

in highp vec4 idColors;
out highp vec4 fragColor;

void main() {
    fragColor = idColors;
}