import { useState } from "react";
import CodeEditor from '@uiw/react-textarea-code-editor';
import { createAndRunMap } from "../MapView/MapView";

import * as d3 from "d3";

const params = require('../../pythonServerConfig.json');

// declaring the types of the props
type GrammarPanelProps = {
    textSpec: string
}

export const GrammarPanelContainer = ({
    textSpec
}: GrammarPanelProps
) =>{

    const [grammar, setCode] = useState('');

    const createLinks = async (url: string, tempGrammar: string = '') => {
        let grammarString = grammar;

        // if(grammarString == ''){
        //     grammarString = textSpec;
        // }

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

                        console.log("requesting knot", knot);

                        await fetch(url+"/linkLayers?predicate="+predicate+"&thisLayer="+thisLayer+"&aggregation="+aggregation+"&otherLayer="+otherLayer+"&abstract="+abstract+"&thisLevel="+thisLevel+"&otherLevel="+otherLevel);
                    
                        console.log("request finished");
                    }
                }
            }
        }

        console.log("loading map");
        createAndRunMap();
    }

    const getInitialGrammar = async (url: string) => {
        let response = await fetch(url+"/getGrammar");
        let data = await response.json();
        let stringData = JSON.stringify(data, null, 4);

        grammar = stringData;

        // setCode(stringData);
        createLinks(url, stringData);
    }



    const applyGrammar = async () => {

        let sendGrammar = grammar;

        // if(sendGrammar == ''){
        //     sendGrammar = textSpec;
        // }

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
            await createLinks(url);
        })
        .catch(error => {
            console.error('Request to update grammar failed: ', error);
        });
       
    }

    const url = "http://"+params.paramsPythonServer.environmentIP+":"+params.paramsPythonServer.port;

    getInitialGrammar(url);

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
                    value={textSpec}
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
        </div>
        
        
    )
}