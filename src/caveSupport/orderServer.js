/*

Node.js server that receives all ids from unity and let user tell which portion of the CAVE2 should exhibit which portion of the map

*/

import inquirer from 'inquirer';
import chalk from 'chalk';
import figlet from 'figlet';
import { WebSocketServer } from 'ws';

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

const askQuestions = () => {
  const questions = [
    {
      type: "input",
      name: "NODE",
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

//check if all nodes connected and send all apropriate slices if they are
const checkNodes = () => {
  setTimeout(() => {

    if(clients.length == 19){
      console.log(
        chalk.blue(`All nodes connected!`)
      );
      // change let node = 1 (to exclude master node)
      for(let node = 1; node < 7; node++){
        let nodeInstances = [];

        let lastDigit = 200 + node;
        let nodeIpAddress = "10.0.0."+lastDigit;
        
        clients.forEach((elem) => {
          let elemIp = elem[1].split("/")[0];

          // is part of the node
          if(elemIp == nodeIpAddress){
            nodeInstances.append(elem);
          }

        });

        // order the array based on port number
        nodeInstances.sort((a,b) => {
          let aPort = a[1].split('/')[1];
          let bPort = b[1].split('/')[1];

          if(aPort > aPort){
            return 1;
          }else if(aPort < bPort){
            return -1;
          }else{
            return 0;
          }

        });

        // calculate the slice of the map each unity instance must receive based on their node ip and process id
        nodeInstances.forEach((elem, index) => {
          slice = (((node-1)*3)+index)+1;
          elem[0].send(slice);
        });

      }
    }else{
      setTimeout(checkNodes, 1000);
    }
  }, 1000);
}

const run = async () => {

  // wait for all connections and build array with it
  // create the websocket server with port 8080
  const wss = new WebSocketServer({port: 4000}, ()=>{
    console.log(
      chalk.green("Initializing server at 4000")
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
      clients.forEach((elem) => {
        if(ws === elem[0]){
          elem[1] = data;
        }
      });
      console.log(
        chalk.green(`${data} received. Clients: ${clients}`)
      );
    });
  });

  checkNodes();

  // show script introduction
  init();

  while(true){

    // ask questions
    const answers = await askQuestions();
    const { NODE, SLICE } = answers;
  
    console.log(
      chalk.white.bgGreen.bold(`Changing ${NODE} to slice ${SLICE}...`)
    );

    clients[parseInt(NODE)-1][0].send(SLICE);

  }

};

run();