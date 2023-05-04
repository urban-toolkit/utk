import React, { useState, useEffect, useRef } from "react";
import { createAndRunMap, emptyMap } from "../MapView/MapView";
import VanillaJSONEditor from "./VanillaJSONEditor";

import * as d3 from "d3";

// jquery
import $ from 'jquery';

import './GrammarPanel.css';

const params = require('../../pythonServerConfig.json');

// declaring the types of the props
type GrammarPanelProps = {
    camera: {position: number[], direction: {right: number[], lookAt: number[], up: number[]}},
    filterKnots: number[],
    inputId: string,
    setCamera: any,
    addNewMessage: any,
    applyGrammarButtonId: string,
    linkMapAndGrammarId: string
}

export const GrammarPanelContainer = ({
    camera,
    filterKnots,
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
                for(let i = 0; i < knot.integration_scheme.length; i++){
                    if(knot.integration_scheme[i].spatial_relation != 'INNERAGG' && knot.integration_scheme[i].in != undefined){
                        let spatial_relation = knot.integration_scheme[i].spatial_relation.toLowerCase();
                        let out = knot.integration_scheme[i].out.name;
                        let outLevel = knot.integration_scheme[i].out.level.toLowerCase();
                        let inLevel = knot.integration_scheme[i].in.level.toLowerCase();
                        let maxDistance = knot.integration_scheme[i].maxDistance;
                        let defaultValue = knot.integration_scheme[i].defaultValue;

                        let operation = knot.integration_scheme[i].operation.toLowerCase();

                        if(operation == 'none'){
                            operation = 'avg'; // there must be an operation to solve conflicts in the join
                        }

                        let inData = knot.integration_scheme[i].in.name;
                        let abstract = knot.integration_scheme[i].abstract;

                        addNewMessage("Joining "+out+" with "+inData, "red");

                        let start = Date.now();

                        if(maxDistance != undefined)
                            await fetch(url+"/linkLayers?spatial_relation="+spatial_relation+"&out="+out+"&operation="+operation+"&in="+inData+"&abstract="+abstract+"&outLevel="+outLevel+"&inLevel="+inLevel+"&maxDistance="+maxDistance+"&defaultValue="+defaultValue);
                        else
                            await fetch(url+"/linkLayers?spatial_relation="+spatial_relation+"&out="+out+"&operation="+operation+"&in="+inData+"&abstract="+abstract+"&outLevel="+outLevel+"&inLevel="+inLevel);

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
                sendGrammar = addCameraAndFilter(grammarStateRef.current, camera, filterKnots);
            }else{
                sendGrammar = addCameraAndFilter(tempGrammarStateRef.current, camera, filterKnots);
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

    const addCameraAndFilter = (grammar: string, camera: {position: number[], direction: {right: number[], lookAt: number[], up: number[]}}, filterKnots: number[]) => {
        
        if(grammar == ''){
            return '';
        }

        if(camera.position.length == 0 && filterKnots.length == 0){
            return grammar;
        }

        let parsedGrammar = JSON.parse(grammar);

        if(camera.position.length != 0)
            parsedGrammar.views[0].map.camera = camera;

        if(filterKnots.length != 0)
            parsedGrammar.views[0].map.filterKnots = filterKnots;
        else if(parsedGrammar.views[0].map.filterKnots != undefined)
            delete parsedGrammar.views[0].map.filterKnots

        return JSON.stringify(parsedGrammar, null, 4);
    }

    const updateLocalNominatim = (camera: { position: number[], direction: { right: number[], lookAt: number[], up: number[] } }, filterKnots: number[]) => {
        setTempGrammar(addCameraAndFilter(grammarStateRef.current, camera, filterKnots)); // overwrite previous changes with grammar integrated with camera and filter knots
    }
    
    const updateCameraNominatim = (place: string) => {

        fetch(url+"/solveNominatim?text="+place, {
            method: 'GET'
        })
        .then(async (response) => {

            let responseJson = await response.json();

            updateLocalNominatim(responseJson, filterKnots);
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

    const checkIfAddCameraAndFilter = (grammar: string, camera: {position: number[], direction: {right: number[], lookAt: number[], up: number[]}}, tempGrammar: string, filterKnots: number[]) => {

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
            let mergedGrammar = addCameraAndFilter(grammar, camera, filterKnots);

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
            setTempGrammar(grammarObj.text);

        }else{
            setTempGrammar(JSON.stringify(grammarObj.json, null, 4));
        }

    }

    return(
        <React.Fragment>
            {showEditor && (
                <>
                <div className="my-editor" style={{height: "100vh", overflow: "auto", fontSize: "24px"}}>
                {/* <div className="my-editor"> */}
                    <VanillaJSONEditor
                    content={checkIfAddCameraAndFilter(grammar, camera, tempGrammar, filterKnots)}
                    readOnly={readOnly}
                    onChange={updateGrammarContent}
                    mode={'text'}
                    indentation={4}
                    />
                </div>
                </>
            )}
        </React.Fragment>
    )
}