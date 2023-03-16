import React, { useState, useEffect, useRef } from "react";
import CodeEditor from '@uiw/react-textarea-code-editor';
import { createAndRunMap, emptyMap } from "../MapView/MapView";
import VanillaJSONEditor from "./VanillaJSONEditor";
import { Col, Row, Button } from "react-bootstrap";


import * as d3 from "d3";

// jquery
import $ from 'jquery';

import './GrammarPanel.css';

const params = require('../../pythonServerConfig.json');

// declaring the types of the props
type GrammarPanelProps = {
    camera: {position: number[], direction: {right: number[], lookAt: number[], up: number[]}},
    inputId: string,
    setCamera: any,
    addNewMessage: any,
    applyGrammarButtonId: string,
    linkMapAndGrammarId: string
}

export const GrammarPanelContainer = ({
    camera,
    inputId,
    setCamera,
    addNewMessage,
    applyGrammarButtonId,
    linkMapAndGrammarId
}: GrammarPanelProps
) =>{

    const [grammar, _setCode] = useState('');

    const grammarStateRef = useRef(grammar);
    const setCode = (data: any) => {
        grammarStateRef.current = data;
        _setCode(data);
    };

    const [tempGrammar, _setTempGrammar] = useState('');

    const tempGrammarStateRef = useRef(tempGrammar);
    const setTempGrammar = (data: any) => {
        tempGrammarStateRef.current = data;
        _setTempGrammar(data);
    };

    const [dirtyTempGrammar, setDirtyTempGrammar] = useState(false);
    const [refresh, setRefresh] = useState(false);

    const [showEditor, setShowEditor] = useState(true);
    const [readOnly, setReadOnly] = useState(false);

    const url = "http://"+params.paramsPythonServer.environmentIP+":"+params.paramsPythonServer.port;

    const createLinksAndRenderStyles = async (url: string, tempGrammar: string = '') => {
        
        let grammarString = grammarStateRef.current;

        if(grammarString == ''){
            grammarString = tempGrammar;
        }

        if(grammarString == '')
            return

        let grammarObject;

        try{
            grammarObject = JSON.parse(grammarString);
        }catch(err){
            emptyMap();
            addNewMessage("Invalid grammar specification", "red");
            return;
        }
        
        if(grammarObject.views == undefined){
            emptyMap();
            addNewMessage("Invalid/Empty grammar specification", "red");
            return;
        }

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

        if(tempGrammarStateRef.current != ''){
            try{
                JSON.parse(tempGrammarStateRef.current); // testing if temp grammar contains a valid grammar
            }catch(err){
                console.error('Grammar is not valid');
                return;
            }
        }

        // let sendGrammar = addCamera(grammar, camera);
        let sendGrammar = '';
        if(d3.select('#'+linkMapAndGrammarId).property("checked")){
            if(tempGrammarStateRef.current == ''){
                sendGrammar = addCamera(grammarStateRef.current, camera);
            }else{
                sendGrammar = addCamera(tempGrammarStateRef.current, camera);
            }
        }else{
            if(tempGrammarStateRef.current == ''){
                sendGrammar = grammarStateRef.current;
            }else{
                sendGrammar = tempGrammarStateRef.current;
            }
        }
        setCode(sendGrammar);
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

    const updateLocalNominatim = (camera: { position: number[], direction: { right: number[], lookAt: number[], up: number[] } }) => {
        setTempGrammar(addCamera(grammarStateRef.current, camera)); // overwrite previous changes with grammar integrated with camera
    }
    
    const updateCameraNominatim = (place: string) => {

        fetch(url+"/solveNominatim?text="+place, {
            method: 'GET'
        })
        .then(async (response) => {

            let responseJson = await response.json();

            updateLocalNominatim(responseJson);
            setCamera(responseJson);
            d3.select("#linkMapAndGrammar").property("checked", true);
        })
        .catch(error => {
            console.error('Error trying to resolve nominatim: ', error);
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

        $('#'+inputId).on("keydown", function(e: any) {
            if(e.key == 'Enter'){

                d3.select("#linkMapAndGrammar").property("checked", false);

                let inputValue = $(this).val();
                
                if(inputValue != undefined && !Array.isArray(inputValue)){
                    updateCameraNominatim(inputValue.toString());
                }else{
                    throw Error("Invalid place");
                }
    
            }
        });

        $('#'+applyGrammarButtonId).on("click", function(e: any) {
            applyGrammar();
        });

        $('#'+linkMapAndGrammarId).on('change', function(e: any){
            setRefresh(!refresh);
        });

    }, []);

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

        // <Row md={6} style={{margin: 0, padding: 0}}>
            // <Col md={12} style={{padding: "0"}} id={"grammarColumn"}>
                <React.Fragment>
                    {/* <div style={{height: "90vh", overflow: "auto"}}> */}
                    {/* <div style={{height: "90vh"}}> */}
                        {showEditor && (
                            <>
                            <div className="my-editor" style={{height: "100vh", overflow: "auto", fontSize: "24px"}}>
                            {/* <div className="my-editor"> */}
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
                    {/* </div> */}
                </React.Fragment>
            // </Col>
        // </Row> 
        
        
    )
}