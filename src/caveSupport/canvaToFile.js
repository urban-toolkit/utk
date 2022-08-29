/* The added code that saves the WebGL canvas as a PNG at every iteration borrows code from the following:

URL: https://webglfundamentals.org/webgl/lessons/webgl-tips.html

*/

var gl;

// array buffer to store binary data of image in blob
var buffer;

// variable to store array buffer containing interaction string
var stringBuff;

// array for parsed string
var parsed;

// use text decoder to get string from array buffer
var decoder = new TextDecoder("utf-8");

// create websocket connection with built-in javascript client for images
const client = new WebSocket('ws://localhost:8080'); // can only use ports 80, 8080, and 443 (SSL)

// create another websocket connection with built-in javascript client for interactions
const clientInt = new WebSocket('ws://localhost:80'); // can only use ports 80, 8080, and 443 (SSL)

// zooming scale
let scale = 1;

// for zooming into the glcanvas element
const el = window.document.querySelector("#map canvas");

// when the "interaction message" has been received...
clientInt.addEventListener('message', function (event) {

    // create file reader to read the contents of the array buffer
    var readerInt = new FileReader();

    // read the contents of the interaction data (blob) as an array buffer
    readerInt.readAsArrayBuffer(event.data);

    // fired when the contents of the blob have been read successfully
    readerInt.onloadend = function () {

        // store result in a variable
        stringBuff = readerInt.result;

        // parse received "string" using spaces as separators
        parsed = (decoder.decode(stringBuff)).split(" ");

        //-------------------------------------------------------------------------------------------------------

        // if the wheel has been scrolled...
        if (parsed[0] == "zoom") {

            // print received message to the console
            console.log('interaction message received: %s', decoder.decode(stringBuff));

            // // update the scale using the received delta y variable converted to a float
            // scale += parseFloat(parsed[1]) * 0.1;

            // // restrict the scale
            // scale = Math.min(Math.max(.125, scale), 4);

            // // apply the scale transformation
            // el.style.transform = `scale(${scale})`;
        }

        // FIXME: if the analog stick of the CAVE2 wand has been moved...; will replace above
        if (parsed[0] == "analog") {

            // print received message to the console
            console.log('interaction message received: %s', decoder.decode(stringBuff));

            // // update the scale using the received delta y variable converted to a float
            // scale += parseFloat(parsed[1]) * 0.1;

            // // restrict the scale
            // scale = Math.min(Math.max(.125, scale), 4);

            // // apply the scale transformation
            // el.style.transform = `scale(${scale})`;
        }

        //-------------------------------------------------------------------------------------------------------

        // if the left mouse button is pressed down...
        if ((parsed[0] == "mouse") && (parsed[1] == "down")) {
        
            // print received message to the console
            console.log('interaction message received: %s', decoder.decode(stringBuff));
        }

        // FIXME: if the L1 button is pressed down...; will replace above
        if ((parsed[0] == "L1") && (parsed[1] == "down")){

            // print received message to the console
            console.log('interaction message received: %s', decoder.decode(stringBuff));
        }

        //-------------------------------------------------------------------------------------------------------

        // if the mouse is moving...
        if ((parsed[0] == "mouse") && (parsed[1] == "move")) {

            // print received message to the console
            console.log('interaction message received: %s', decoder.decode(stringBuff));
        }

        // FIXME: if the wand is moving while L1 is pressed down...; will replace above
        if ((parsed[0] == "L1") && (parsed[1] == "move")){

            // print received message to the console
            console.log('interaction message received: %s', decoder.decode(stringBuff));
        }

        //-------------------------------------------------------------------------------------------------------

        // if the left mouse button is released...
        if ((parsed[0] == "mouse") && (parsed[1] == "up")) {
        
            // print received message to the console
            console.log('interaction message received: %s', decoder.decode(stringBuff));
        }

        // FIXME: if the L1 button is released...; will replace above
        if ((parsed[0] == "L1") && (parsed[1] == "up")) {
            
            // print received message to the console
            console.log('interaction message received: %s', decoder.decode(stringBuff));
        }

        //-------------------------------------------------------------------------------------------------------
    }   
});

// EDIT: saveBlob
const saveBlob = (function() {

    // create html element a
    const a = document.createElement('a');

    // append element a to the document
    document.body.appendChild(a);
    
    // no display type
    a.style.display = 'none';

    // saveData
    return function saveData(blob, fileName) {

        // save a string containing an object URL for blob
        const url = window.URL.createObjectURL(blob);

        // specifies the link's destination
        a.href = url;
    };
}());

function sendFrames() {

    // gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // assign canvas element
    var glcanvas = window.document.querySelector("#map canvas");

    // create file reader to read the contents of the blob
    var reader = new FileReader();

    // create a blob object representing the image contained in the canvas
    glcanvas.toBlob((blob) => {

        // call saveBlob and specify the name of the downloaded png
        saveBlob(blob, `screencapture-${glcanvas.width}x${glcanvas.height}.png`);

        // read the contents of the blob
        reader.readAsArrayBuffer(blob);

        // fired when the contents of the blob have been read successfully
        reader.onloadend = function () {

            // store result in array buffer
            buffer = reader.result;
        }
    });

    // ensure client is connected before sending buffer; prevents the need to reload browser
    if (client.readyState == 1) {

        // send array buffer to NodeJS server
        client.send(buffer);
    }

    requestAnimationFrame(sendFrames);

}

function initialize() {

    var canvas = window.document.querySelector("#map canvas");
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    gl = canvas.getContext("webgl2");

    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    // no animation is being really made but frames are being sent (usually 60fps)
    window.requestAnimationFrame(sendFrames);

}


window.onload = initialize;