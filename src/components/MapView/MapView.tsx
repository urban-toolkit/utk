import {Col} from 'react-bootstrap'
import { useCallback, useEffect, useRef } from 'react'

import './MapView.css';
import { vertexShaderSrc } from './vertex.glsl';
import { fragmentShaderSrc } from './fragment.glsl';
import { 
    createShader, 
    createProgram, 
    createCube, 
    createVAO, 
    createBuffers, 
    scaleMatrix, 
    rotateXMatrix, 
    rotateYMatrix, 
    translateMatrix, 
    multiplyArrayOfMatrices,
    perspectiveMatrix,
    invertMatrix} from '../../utilities/utils';

var gl: any;
var program: WebGLProgram;
var buffers: any;
var vao: WebGLVertexArrayObject;
var modelLoc: any;
var projectionLoc: any;
var viewLoc: any;
var modelMatrix: Iterable<number>;
var projectionMatrix: Iterable<number>;
var viewMatrix: Iterable<number>;


export const MapView = () => {
    const canvas = useRef<HTMLCanvasElement>(null!);
    const div = useRef<HTMLDivElement>(null!);


    function updateModelMatrix() {

        var scale = scaleMatrix(0.5, 0.5, 0.5);
        var rotateX = rotateXMatrix(45.0 * Math.PI / 180.0);
        var rotateY = rotateYMatrix(-45.0 * Math.PI / 180.0);
        var translation = translateMatrix(0, 0, -50);
    
        modelMatrix = multiplyArrayOfMatrices([
            translation,
            rotateX,
            rotateY,
            scale
        ]);
    
    }
    
    function updateProjectionMatrix() {
    
        var aspect = window.innerWidth /  window.innerHeight;
        projectionMatrix = perspectiveMatrix(45 * Math.PI / 180.0, aspect, 0, 500);
        // projectionMatrix = orthographicMatrix(-aspect, aspect, -1, 1, -1, 500);
    
    }
    
    function updateViewMatrix(){
    
        var now = Date.now();
        var moveInAndOut = 5 - 50.0*(Math.sin(now * 0.002) + 1.0)/2.0;
        // var moveInAndOut = 0
    
        var position = translateMatrix(0, 0, moveInAndOut);
        viewMatrix = invertMatrix(position);
    
    }


    const draw = useCallback(() => {

        gl.clearColor(1, 1, 1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
    
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    
        gl.useProgram(program);
    
        updateModelMatrix();
        gl.uniformMatrix4fv(modelLoc, false, new Float32Array(modelMatrix));
    
        updateProjectionMatrix();
        gl.uniformMatrix4fv(projectionLoc, false, new Float32Array(projectionMatrix));
    
        updateViewMatrix();
        gl.uniformMatrix4fv(viewLoc, false, new Float32Array(viewMatrix));
    
        gl.bindVertexArray(vao);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.elements);
        gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
    
        requestAnimationFrame(draw);
    
    }, [])

    useEffect(()=> {
        let can = canvas.current;

        gl = can.getContext("webgl2");
    
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);

        var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSrc);
        var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc);
        program = createProgram(gl, vertexShader, fragmentShader);


        var triangles = createCube();
        buffers = createBuffers(gl, triangles);

        var posAttribLoc = gl.getAttribLocation(program, "position");
        var colorAttribLoc = gl.getAttribLocation(program, "color");
        vao = createVAO(gl, posAttribLoc, colorAttribLoc, buffers);

        modelLoc = gl.getUniformLocation(program, "uModel");
        projectionLoc = gl.getUniformLocation(program, "uProjection");
        viewLoc = gl.getUniformLocation(program, "uView");

        window.requestAnimationFrame(draw);


    }, [draw])

    return(
        <Col md={11}>
            <canvas className='mapCanvas' ref={canvas} style={{border:"1px solid #000000"}}></canvas>
            <div ref={div} className={'mapPlaceHolderDiv'}>Map</div>
        </Col>
    )
}