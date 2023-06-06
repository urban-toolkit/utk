/*
  Node.js server that receives IDs and IPs from unity and decide which portion of the CAVE2 should exhibit which portion of the map.
  Also let user manually control it on the fly.
*/

import inquirer from 'inquirer';
import chalk from 'chalk';
import figlet from 'figlet';
import { WebSocketServer } from 'ws';
// import {paramsSendToUnity} from '../../params.js';

var clients = [];

const init = () => {
  console.log(
    chalk.green(
      figlet.textSync("Order Server", {
        font: "Ghost",
        horizontalLayout: "default",
        verticalLayout: "default"
      })
    )
  );
};

// Gives the ability to manually control the slice distribution
const askQuestions = () => {
  const questions = [
    {
      name: "NODE",
      type: "input",
      message: "Pick a node (1-19):"
    },
    {
      name: "SLICE",
      type: "input",
      message: "Pick a slice (1-18):"
    }
  ];
  return inquirer.prompt(questions);
};

// Check if all nodes connected and send all apropriate slices if they are
const checkNodes = () => {
  setTimeout(() => {

    if(clients.length == 19 && clients[clients.length-1][1] != ''){
      console.log(
        chalk.blue(`All nodes connected!`)
      );

      // let node = 1 (to exclude master node). There are 6 nodes in total in the CAVE2 (excluding backwall)
      for(let node = 1; node < 7; node++){
        let nodeInstances = []; // Store connections to the Unity instances in specific node

        let lastDigit = 200 + node;
        let nodeIpAddress = "10.0.0."+lastDigit; // The IP addresses of the nodes in the CAVE2 follow a crescent order
        
        clients.forEach((elem) => {
          let elemIp = elem[1].split("/")[0];

          // Is part of the node
          if(elemIp == nodeIpAddress){
            nodeInstances.push(elem);
          }

        });

        // Order the array based on ID number
        nodeInstances.sort((a,b) => {
          let aID = a[1].split('/')[1];
          let bID = b[1].split('/')[1];

          if(aID > aID){
            return 1;
          }else if(aID < bID){
            return -1;
          }else{
            return 0;
          }

        });

        // Calculate the slice of the map each Unity instance must receive based on their Node IP and Window ID
        nodeInstances.forEach((elem, index) => {
          let slice = (((node-1)*3)+index)+1;
          elem[0].send(slice);
        });

      }
    }else{
      setTimeout(checkNodes, 1000);
    }
  }, 1000);
}

const run = async () => {

  let paramsSendToUnity = data.paramsSendToUnity;

  const wss = new WebSocketServer({port: paramsSendToUnity.orderServerPort}, ()=>{
    console.log(
      chalk.green("Initializing server at "+paramsSendToUnity.orderServerPort)
    );
    console.log(
      chalk.green("Waiting for all nodes to connect...")
    );
    });

  wss.on('connection', (ws)=>{
    // Add connected client to array
    clients.push([ws, '']);
    console.log(
      chalk.green(`${clients.length} nodes connected`)
    );

    ws.on('message', (data)=>{
      // Associate incoming ID information with right client connection
      clients.forEach((elem) => {
        if(ws === elem[0]){
          elem[1] = data.toString();
        }
      });
      /*console.log(
        chalk.green(`${data} received. Clients: ${clients}`)
      );*/
    });
  });

  checkNodes();

  // Show script introduction
  init();

  while(true){

    // Ask questions
    const answers = await askQuestions();
    const { NODE, SLICE } = answers;
  
    console.log(
      chalk.white.bgGreen.bold(`Changing ${NODE} to slice ${SLICE}...`)
    );

    // Send choosen slice number to Unity instance
    clients[parseInt(NODE)-1][0].send(SLICE);

  }

  

};

run();
