/* The added code that saves the WebGL canvas as a PNG at every iteration borrows code from the following:
URL: https://webglfundamentals.org/webgl/lessons/webgl-tips.html
*/

// variable to store array buffer containing interaction string
var stringBuff;

// array for parsed string
var parsed;

// use text decoder to get string from array buffer
var decoder = new TextDecoder("utf-8");

// measuring frame rate
let blobsRead = 0;
let startTime = new Date(); 

// canvas element
var glcanvas;

var map;

var client;

var lastServerComunnication = new Date();

// // when the "interaction message" has been received...
// clientInt.addEventListener('message', function (event) {

//     // create file reader to read the contents of the array buffer
//     var readerInt = new FileReader();

//     // read the contents of the interaction data (blob) as an array buffer
//     readerInt.readAsArrayBuffer(event.data);

//     // fired when the contents of the blob have been read successfully
//     readerInt.onloadend = function () {

//         // store result in a variable
//         stringBuff = readerInt.result;

//         // parse received "string" using spaces as separators
//         parsed = (decoder.decode(stringBuff)).split(" ");

//         //-------------------------------------------------------------------------------------------------------

//         // if the wheel has been scrolled...
//         if (parsed[0] == "zoom") {

//             // print received message to the console
//             console.log('interaction message received: %s', decoder.decode(stringBuff));
//             map._mouse.mouseWheelCustom(0, 0, -1 * parsed[1] * 150);

//             // let event = new WheelEvent("wheel");
//             // event.offsetX = 0; // TODO get mouse position from unity
//             // event.offsetY = 0; // TODO get mouse position from unity
//             // event.deltaY = -1 * parsed[1] * 150;
//             // glcanvas.dispatchEvent(event);
//         }

//         // FIXME: if the analog stick of the CAVE2 wand has been moved...; will replace above
//         if (parsed[0] == "analog") {

//             // print received message to the console
//             console.log('interaction message received: %s', decoder.decode(stringBuff));
//             map._mouse.mouseWheelCustom(0, 0, -1 * parsed[1] * 150);

//             // // update the scale using the received delta y variable converted to a float
//             // scale += parseFloat(parsed[1]) * 0.1;

//             // // restrict the scale
//             // scale = Math.min(Math.max(.125, scale), 4);

//             // // apply the scale transformation
//             // el.style.transform = `scale(${scale})`;
//         }

//         //-------------------------------------------------------------------------------------------------------

//         // if the left mouse button is pressed down...
//         if ((parsed[0] == "mouse") && (parsed[1] == "down")) {
        
//             // print received message to the console
//             console.log('interaction message received: %s', decoder.decode(stringBuff));
//         }

//         // FIXME: if the L1 button is pressed down...; will replace above
//         if ((parsed[0] == "L1") && (parsed[1] == "down")){

//             // print received message to the console
//             console.log('interaction message received: %s', decoder.decode(stringBuff));
//         }

//         //-------------------------------------------------------------------------------------------------------

//         // if the mouse is moving...
//         if ((parsed[0] == "mouse") && (parsed[1] == "move")) {

//             // print received message to the console
//             console.log('interaction message received: %s', decoder.decode(stringBuff));
//         }

//         // FIXME: if the wand is moving while L1 is pressed down...; will replace above
//         if ((parsed[0] == "L1") && (parsed[1] == "move")){

//             // print received message to the console
//             console.log('interaction message received: %s', decoder.decode(stringBuff));
//         }

//         //-------------------------------------------------------------------------------------------------------

//         // if the left mouse button is released...
//         if ((parsed[0] == "mouse") && (parsed[1] == "up")) {
        
//             // print received message to the console
//             console.log('interaction message received: %s', decoder.decode(stringBuff));
//         }

//         // FIXME: if the L1 button is released...; will replace above
//         if ((parsed[0] == "L1") && (parsed[1] == "up")) {
            
//             // print received message to the console
//             console.log('interaction message received: %s', decoder.decode(stringBuff));
//         }

//         //-------------------------------------------------------------------------------------------------------
//     }   
// });

function establishConnection(host, port = '8080'){
    // create websocket connection with built-in javascript client for images
    client = new WebSocket('ws://'+host+':'+port); // can only use ports 80, 8080, and 443 (SSL)

    client.onerror =  function(event){
        setTimeout(function(host) {
            establishConnection(host, port);
        }, 3000); // try to reconnect after 3 seconds
    };

    client.onopen = function() {
        client.addEventListener('message', function(event) {
            if(event.data == "true"){
                lastServerComunnication = new Date();
            }
        });
    };

    client.onclose = function() {
        setTimeout(function() {
            establishConnection(host, port);
        }, 3000); // try to reconnect after 3 seconds
    }
}

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

        a.download = `saved_blob.png`;

        // counterFrames++;

        a.click();

    };
}());

// function sendFrames(time, glcanvas, reader) {
function sendFrames(time, glcanvas) {

    setTimeout(function(){

        // create file reader to read the contents of the blob
        // var reader = new FileReader();

        // create a blob object representing the image contained in the canvas
        glcanvas.toBlob((blob) => {

            // call saveBlob and specify the name of the downloaded png
            // saveBlob(blob, `screencapture-${glcanvas.width}x${glcanvas.height}.png`);

            // reader.readAsArrayBuffer(blob);

            // // fired when the contents of the blob have been read successfully
            // reader.onloadend = function () {
            //     blobsRead += 1;
            //     console.log("Blobs per second: ");
            //     console.log(blobsRead/((new Date() - startTime)/1000));
            //     console.log("Buffered amount: ");
            //     console.log(client.bufferedAmount);
            //     // check if the connection is ready and if all previous data was sent
            //      if (client.readyState == 1) {
            //         buffer = reader.result;
            //         client.send(buffer);
            //     }
            //     sendFrames(time, glcanvas);
            //     // buffer = reader.result;
            // }

            // test sending pure blob ===========
            // blobsRead += 1;
            // console.log("Blobs per second: ");
            // console.log(blobsRead/((new Date() - startTime)/1000));
            // console.log("Buffered amount: ");
            // console.log(client.bufferedAmount);
             if (client.readyState == 1) {
                client.send(blob);
            }
            sendFrames(time, glcanvas);

        }, 'image/png');

    }, time);

    // if we are more than 120 seconds without hearing from unity close the browser
    var timeElapsed = (new Date() - lastServerComunnication)/1000;
    if(timeElapsed > 20){
        window.close();
    }

}

export async function initialize(objectMap){

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const port = urlParams.get('port')

    map = objectMap;

    let time = 1000/60; //60fps
    
    // assign canvas element
    let glcanvas = window.document.querySelector("canvas");

    establishConnection('localhost', port);

    sendFrames(time, glcanvas);
}