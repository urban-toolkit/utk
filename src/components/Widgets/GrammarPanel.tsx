import { useState, useEffect } from "react";
import CodeEditor from '@uiw/react-textarea-code-editor';
import { createAndRunMap } from "../MapView/MapView";
import VanillaJSONEditor from "./VanillaJSONEditor";
import { Col, Row, Button } from "react-bootstrap";
import { VisWidget } from "./VisWidget";

import * as d3 from "d3";

const params = require('../../pythonServerConfig.json');

// declaring the types of the props
type GrammarPanelProps = {
    genericScreenPlotToggle: React.Dispatch<React.SetStateAction<any>>,
    addGenericPlot: any,
    removeGenericPlot: React.Dispatch<React.SetStateAction<any>>,
    togglePlotCollection: React.Dispatch<React.SetStateAction<any>>,
    modifyLabelPlot: any,
    modifyEditingState: React.Dispatch<React.SetStateAction<any>>,
    listPlots: {id: number, hidden: boolean, svgId: string, label: string, checked: boolean, edit: boolean}[],
    camera: {position: number[], direction: {right: number[], lookAt: number[], up: number[]}}
}

export const GrammarPanelContainer = ({
    genericScreenPlotToggle,
    addGenericPlot,
    removeGenericPlot,
    togglePlotCollection,
    modifyLabelPlot,
    modifyEditingState,
    listPlots,
    camera
}: GrammarPanelProps
) =>{

    const [grammar, setCode] = useState('');
    const [tempGrammar, setTempGrammar] = useState('');
    const [dirtyTempGrammar, setDirtyTempGrammar] = useState(false);
    const [refresh, setRefresh] = useState(false);
    const [systemMessages, setSystemMessages] = useState<{text: string, color: string}[]>([]);

    const [showEditor, setShowEditor] = useState(true);
    const [readOnly, setReadOnly] = useState(false);

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
                        let maxDistance = knot.linkingScheme[i].maxDistance;

                        let aggregation = knot.aggregationScheme[i].toLowerCase();

                        if(aggregation == 'none'){
                            aggregation = 'avg'; // there must be an aggregation to solve conflicts in the join
                        }

                        if(maxDistance != undefined && predicate != 'nearest'){
                            throw Error("The maxdistance field can only be used with the nearest predicate");
                        }

                        let otherLayer = knot.linkingScheme[i].otherLayer;
                        let abstract = knot.linkingScheme[i].abstract;

                        addNewMessage("Joining "+thisLayer+" with "+otherLayer, "red");

                        let start = Date.now();

                        if(maxDistance != undefined)
                            await fetch(url+"/linkLayers?predicate="+predicate+"&thisLayer="+thisLayer+"&aggregation="+aggregation+"&otherLayer="+otherLayer+"&abstract="+abstract+"&thisLevel="+thisLevel+"&otherLevel="+otherLevel+"&maxDistance="+maxDistance);
                        else
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

        try{
            JSON.parse(tempGrammar); // testing if temp grammar contains a valid grammar
        }catch(err){
            console.error('Grammar is not valid');
            return;
        }

        // let sendGrammar = addCamera(grammar, camera);
        let sendGrammar = addCamera(tempGrammar, camera);
        setCode(tempGrammar);
        setTempGrammar('');

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

    const checkIfAddCamera = (grammar: string, camera: {position: number[], direction: {right: number[], lookAt: number[], up: number[]}}, tempGrammar: string) => {

        let inputLink = d3.select("#linkMapAndGrammar")
        
        let returnedGrammar: any = {};

        if(inputLink.empty()){
            if(tempGrammar != ''){
                returnedGrammar.text = tempGrammar;
            }else if(grammar != ''){
                returnedGrammar.json = JSON.parse(grammar);
            }else{
                returnedGrammar.json = {};
            }
            return returnedGrammar
        }

        let mapAndGrammarLinked = inputLink.property("checked");

        if(mapAndGrammarLinked){
            let mergedGrammar = addCamera(grammar, camera);

            if(mergedGrammar != ''){
                returnedGrammar.json = JSON.parse(mergedGrammar);
            }else{
                returnedGrammar.json = {};
            }

            return returnedGrammar
        }else{
            if(tempGrammar != ''){
                returnedGrammar.text = tempGrammar;
            }else if(grammar != ''){
                returnedGrammar.json = JSON.parse(grammar);
            }else{
                returnedGrammar.json = {};
            }

            return returnedGrammar;
        }
    }

    const updateGrammarContent = (grammarObj: any) => {
        if(grammarObj.text != undefined){
            // try{
            //     setTempGrammar(JSON.stringify(JSON.parse(grammarObj.text), null, 4));
            // }catch(err){
            //     setTempGrammar(grammarObj.text);
            // }
            setTempGrammar(grammarObj.text);

        }else{
            // setCode(JSON.stringify(grammarObj.json));
            setTempGrammar(JSON.stringify(grammarObj.json, null, 4));
        }

    }

    return(
        // <div>
        //     <div>
        //         <h3>Grammar</h3>
        //         {/* <textarea id="grammarTextArea" style={{width: "280px", height: "350px"}} defaultValue={textSpec} /> */}


        //         {/* <button type="button" onClick={() => applyGrammar(d3.select("#grammarTextArea").property('value'))}>Apply</button> */}
        //     </div>
        // </div>
        <Row md={6} style={{margin: 0}}>

            <Col md={10} style={{padding: "0"}} id={"grammarColumn"}>
                <div style={{height: "100vh", overflow: "auto"}}>
                    {showEditor && (
                        <>
                        <div className="my-editor">
                            <VanillaJSONEditor
                            content={checkIfAddCamera(grammar, camera, tempGrammar)}
                            readOnly={readOnly}
                            onChange={updateGrammarContent}
                            mode={'text'}
                            indentation={4}
                            />
                        </div>
                        </>
                    )}
                </div>
            </Col>

            <Col md={2} style={{padding: "4px", backgroundColor: "#F5F5F5"}} className="d-flex align-items-center justify-content-center">
                <Row style={{margin: 0}}>
                    {
                        systemMessages.map((item, index) => (
                            <p style={{color: item.color, textAlign: "center", fontWeight: "bold"}} key={index}>{item.text}</p>
                        ))
                    }
                    <Button variant="secondary" onClick={() => applyGrammar()}>Apply</Button>
                    <div style={{textAlign: "center", paddingLeft: 0}}>
                        <input type="checkbox" id="linkMapAndGrammar" style={{margin: "8px"}} onChange={() => setRefresh(!refresh)}></input>
                        <label htmlFor="linkMapAndGrammar"> Link</label>
                    </div>
                    <VisWidget 
                        genericScreenPlotToggle = {genericScreenPlotToggle}
                        addGenericPlot = {addGenericPlot}
                        removeGenericPlot = {removeGenericPlot}
                        togglePlotCollection = {togglePlotCollection}
                        listPlots = {listPlots}
                        modifyLabelPlot = {modifyLabelPlot}
                        modifyEditingState = {modifyEditingState}
                    />
                </Row>
            </Col>
            
        </Row>
        
        
    )
}