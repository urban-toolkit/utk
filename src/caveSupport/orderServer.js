/*

Node.js server that receives all ids from unity and let user tell which portion of the CAVE2 should exhibit which portion of the map

*/

import inquirer from 'inquirer';
import chalk from 'chalk';
import figlet from 'figlet';
import { WebSocketServer } from 'ws';

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

const run = async () => {
  var clients = [];

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
    clients.push(ws);
    console.log(
      chalk.green(`${clients.length} nodes connected`)
    );
    
  });

  // show script introduction
  init();

  while(true){
    // ask questions
    const answers = await askQuestions();
    const { NODE, SLICE } = answers;
  
    console.log(
      chalk.white.bgGreen.bold(`Changing ${NODE} to slice ${SLICE}...`)
    );

    clients[parseInt(NODE)-1].send(SLICE);

  }

};

run();