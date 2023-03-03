import { useState, useEffect } from "react";
import CodeEditor from '@uiw/react-textarea-code-editor';
import { createAndRunMap } from "../MapView/MapView";

import * as d3 from "d3";

const params = require('../../pythonServerConfig.json');

// declaring the types of the props
type GrammarPanelProps = {
    camera: {position: number[], direction: {right: number[], lookAt: number[], up: number[]}}
}

export const GrammarPanelContainer = ({
    camera
}: GrammarPanelProps
) =>{

    const [grammar, setCode] = useState('');
    const [refresh, setRefresh] = useState(false);
    const [systemMessages, setSystemMessages] = useState<{text: string, color: string}[]>([]);

    const url = "http://"+params.paramsPythonServer.environmentIP+":"+params.paramsPythonServer.port;

    const addNewMessage = (msg: string, color: string) => {
        
        // let messagesCopy = [];

        // for(let i = 0; i < systemMessages.length; i++){
        //     messagesCopy.push(systemMessages[i]);
        // }

        // messagesCopy.push({text: msg, color: color});

        // while(messagesCopy.length > 3){
        //     messagesCopy.shift();
        // }

        // setSystemMessages(messagesCopy);

        setSystemMessages([{text: msg, color: color}]);
    }

    const createLinksAndRenderStyles = async (url: string, tempGrammar: string = '') => {
        
        let grammarString = grammar;

        if(grammarString == ''){
            grammarString = tempGrammar;
        }

        if(grammarString == '')
            return

        let grammarObject = JSON.parse(grammarString);

        for(const knot of grammarObject.views[0].knots){
            if(knot.knotOp != true){
                for(let i = 0; i < knot.linkingScheme.length; i++){
                    if(knot.linkingScheme[i].predicate != 'INNERAGG' && knot.linkingScheme[i].otherLayer != undefined){
                        let predicate = knot.linkingScheme[i].predicate.toLowerCase();
                        let thisLayer = knot.linkingScheme[i].thisLayer;
                        let thisLevel = knot.linkingScheme[i].thisLevel.toLowerCase();
                        let otherLevel = knot.linkingScheme[i].otherLevel.toLowerCase();

                        let aggregation = knot.aggregationScheme[i].toLowerCase();

                        if(aggregation == 'none'){
                            aggregation = 'avg'; // there must be an aggregation to solve conflicts in the join
                        }

                        let otherLayer = knot.linkingScheme[i].otherLayer;
                        let abstract = knot.linkingScheme[i].abstract;

                        addNewMessage("Joining "+thisLayer+" with "+otherLayer, "red");

                        let start = Date.now();

                        await fetch(url+"/linkLayers?predicate="+predicate+"&thisLayer="+thisLayer+"&aggregation="+aggregation+"&otherLayer="+otherLayer+"&abstract="+abstract+"&thisLevel="+thisLevel+"&otherLevel="+otherLevel);
                    
                        let end = Date.now();
                        let elapsed = end - start; 

                        addNewMessage("Join finished in " +(elapsed/1000)+" seconds", "green");

                    }
                }
            }
        }

        // TODO: make the calculation of render styles more efficient
        // addNewMessage("Adding render styles", "red");
        // await fetch(url+"/addRenderStyles");
        // addNewMessage("Render Styles added", "red");


        addNewMessage("Loading map", "red");
        createAndRunMap();
        addNewMessage("Map loaded", "green");
    }

    const applyGrammar = async () => {

        let sendGrammar = addCamera(grammar, camera);

        const data = { "grammar": sendGrammar };
    
        fetch(url+"/updateGrammar", {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(async (response) => {
            await createLinksAndRenderStyles(url);
        })
        .catch(error => {
            console.error('Request to update grammar failed: ', error);
        });
       
    }

    // run only once to load the initial data
    useEffect(() => {
        async function getInitialGrammar(url: string){
            let response = await fetch(url+"/getGrammar");
            let data = await response.json();
            let stringData = JSON.stringify(data, null, 4);

            setCode(stringData);
            createLinksAndRenderStyles(url, stringData);
        }

        getInitialGrammar(url);
    }, []);

    const addCamera = (grammar: string, camera: {position: number[], direction: {right: number[], lookAt: number[], up: number[]}}) => {
        
        if(grammar == ''){
            return ''
        }

        if(camera.position.length == 0){
            return grammar
        }

        let parsedGrammar = JSON.parse(grammar);

        parsedGrammar.views[0].map.camera = camera;

        return JSON.stringify(parsedGrammar, null, 4);
    }

    const checkIfAddCamera = (grammar: string, camera: {position: number[], direction: {right: number[], lookAt: number[], up: number[]}}) => {
        let inputLink = d3.select("#linkMapAndGrammar")
        
        if(inputLink.empty())
            return grammar

        let mapAndGrammarLinked = inputLink.property("checked");

        if(mapAndGrammarLinked)
            return addCamera(grammar, camera);
        else
            return grammar;
    }

    return(
        // <div>
        //     <div>
        //         <h3>Grammar</h3>
        //         {/* <textarea id="grammarTextArea" style={{width: "280px", height: "350px"}} defaultValue={textSpec} /> */}


        //         {/* <button type="button" onClick={() => applyGrammar(d3.select("#grammarTextArea").property('value'))}>Apply</button> */}
        //     </div>
        // </div>
        <div>
            <div style={{height: "650px", overflow: "auto"}}>
                <CodeEditor
                    value={checkIfAddCamera(grammar, camera)}
                    language="js"
                    placeholder="Grammar specification"
                    onChange={(evn) => setCode(evn.target.value)}
                    padding={15}
                    style={{
                        fontSize: 12,
                        backgroundColor: "#f5f5f5",
                        fontFamily: 'ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace',
                        
                    }}
                />
            </div>
            <button type="button" onClick={() => applyGrammar()}>Apply</button>
            <input type="checkbox" id="linkMapAndGrammar" style={{margin: "8px"}} onChange={() => setRefresh(!refresh)}></input>
            <label htmlFor="linkMapAndGrammar"> Link Map and Grammar</label>
            {
                systemMessages.map((item, index) => (
                    <p style={{color: item.color}} key={index}>{item.text}</p>
                ))
            }
        </div>
        
        
    )
}