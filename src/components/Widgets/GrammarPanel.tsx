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
    textSpec,
}: GrammarPanelProps
) =>{

    const [grammar, setCode] = useState('');

    const applyGrammar = () => {

        let sendGrammar = grammar;

        if(sendGrammar == ''){
            sendGrammar = textSpec;
        }

        const url = "http://"+params.paramsPythonServer.environmentIP+":"+params.paramsPythonServer.port+"/updateGrammar";
        const data = { "grammar": sendGrammar };
    
        fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then((response) => {
            createAndRunMap();
        })
        .catch(error => {
            console.error('Request to update grammar failed: ', error);
        });
       
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