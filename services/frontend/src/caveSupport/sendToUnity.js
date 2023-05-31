// import {paramsSendToUnity} from '../params.js';

var client;
var clientOrder;
var previousSlice = 1;

var initializedAllMapsLayers = false;

var lastServerComunnication = new Date();

function establishConnectionUnity(port = '8080'){
    // Create websocket connection with unity to send images
    client = new WebSocket('ws://'+paramsSendToUnity.unityServerIP+':'+port);

    client.onerror =  function(event){
        setTimeout(function() {
            establishConnectionUnity(port);
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
            establishConnectionUnity(port);
        }, 3000); // try to reconnect after 3 seconds
    }
}

// Establishes the conneciton with the server that controls order of exhibition of each slice of the map
function establishConnectionOrderServer(objectMap, nodeIp, myWindowPosID){
    clientOrder = new WebSocket('ws://'+paramsSendToUnity.orderServerIP+':'+paramsSendToUnity.orderServerPort);

    clientOrder.onopen = function() {
        clientOrder.send(nodeIp+"/"+myWindowPosID);

        clientOrder.addEventListener('message', function(event) {
            if(event.data){
                var tranlateValue = 0.367 * (parseInt(event.data)-previousSlice); // 0.367 is a hard coded value for a aproximate 1366 pixels camera translation
                previousSlice = parseInt(event.data);
                objectMap._camera.translate(tranlateValue, 0); 
                objectMap.render();
            }
        });
    };
}

function sendFrames(time, glcanvas) {

    setTimeout(function(){

        // create a blob object representing the image contained in the canvas
        glcanvas.toBlob((blob) => {
             if (client.readyState == 1) {
                // send blob image to Unity
                client.send(blob);
            }
            sendFrames(time, glcanvas);

        }, 'image/png');

    }, time);

    // if we are more than 20 seconds without hearing from unity, close the browser
    var timeElapsed = (new Date() - lastServerComunnication)/1000;
    if(timeElapsed > 20){
        window.close();
    }

}

export async function initializeConnection(objectMap){

    if(initializedAllMapsLayers){ // initMapView has two rendering phases (yield). We want to initialize after the last phase. TODO: more robust solution

        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const port = urlParams.get('port');
        const nodeIp = urlParams.get('nodeIp');
        const myWindowPosID = urlParams.get('myWindowPosID');

        let time = 1000/60; //60fps

        let glcanvas = window.document.querySelector("canvas");

        if(port){
            establishConnectionUnity(port);
        }else{
            establishConnectionUnity('8080');
        }

        establishConnectionOrderServer(objectMap, nodeIp, myWindowPosID);
        
        sendFrames(time, glcanvas);
    }

    initializedAllMapsLayers = true;

}