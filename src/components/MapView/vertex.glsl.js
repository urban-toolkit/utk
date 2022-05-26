export const vertexShaderSrc = `#version 300 es

uniform mat4 uModel;
uniform mat4 uProjection;
uniform mat4 uView;

in vec3 position;
in vec4 color;

out vec4 vColor;

void main() {
    vColor = color;
    gl_Position = uProjection * uView * uModel * vec4(position, 1);
    // gl_Position = vec4(position, 1);
}
`;