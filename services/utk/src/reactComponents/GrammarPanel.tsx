import React, { useState, useEffect, useRef } from "react";
// import { createAndRunMap, emptyMainDiv } from "../../../../App";
import VanillaJSONEditor from "./VanillaJSONEditor";
import { Col, Row, Button } from 'react-bootstrap';
import GrammarHistory from "../GrammarHistory";
//import * as fs from 'fs';
import * as d3 from "d3";

import './GrammarPanel.css';

// const params = require('./pythonServerConfig.json');

import { IGrammar } from "../interfaces";

// declaring the types of the props
type GrammarPanelProps = {
    obj: any,
    viewId: string,
    initialGrammar: IGrammar,
    camera: { position: number[], direction: { right: number[], lookAt: number[], up: number[] } },
    filterKnots: number[],
    inputId: string,
    setCamera: any,
    addNewMessage: any,
    applyGrammarButtonId: string,
    linkMapAndGrammarId: string
}

export const GrammarPanelContainer = ({
    obj,
    viewId,
    initialGrammar,
    camera,
    filterKnots,
    inputId,
    setCamera,
    addNewMessage,
    applyGrammarButtonId,
    linkMapAndGrammarId
}: GrammarPanelProps
) => {

    const [grammar, _setCode] = useState('');
    const [grammarHistory, _setGrammarHistory] = useState<string[]>([]); //TODO

    const [diffs, _setDiffs] = useState<string[]>([]);

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

    const url = process.env.REACT_APP_BACKEND_SERVICE_URL;

    // useEffect(() => {
    //     console.log('History Length', grammarHistory.length);
    // }, [grammarHistory])

    const applyGrammar = async () => {

        // console.log('Grammar has been applied!')
        // console.log('Current Grammar');
        // console.log(JSON.stringify(grammarStateRef));
        // console.log('Temp Grammar');
        // console.log(JSON.stringify(tempGrammarStateRef));
        GrammarHistory.pushToHistory(JSON.stringify(tempGrammarStateRef));
        console.log(`Grammar History length -> ${GrammarHistory.getLength()}`)

        if (tempGrammarStateRef.current != '') {
            try {
                JSON.parse(tempGrammarStateRef.current); // testing if temp grammar contains a valid grammar
            } catch (err) {
                console.error('Grammar is not valid');
                return;
            }
        }

        //Save old grammar into array
        _setGrammarHistory(grammarHistory => [...grammarHistory, JSON.stringify(grammarStateRef)])

        // console.log(grammarHistory.length);


        // let sendGrammar = addCamera(grammar, camera);
        let sendGrammar = '';
        if (d3.select('#' + linkMapAndGrammarId).property("checked")) {
            if (tempGrammarStateRef.current == '') {
                sendGrammar = addCameraAndFilter(grammarStateRef.current, camera, filterKnots);
            } else {
                sendGrammar = addCameraAndFilter(tempGrammarStateRef.current, camera, filterKnots);
            }
        } else {
            if (tempGrammarStateRef.current == '') {
                sendGrammar = grammarStateRef.current;
            } else {
                sendGrammar = tempGrammarStateRef.current;
            }
        }
        setCode(sendGrammar);
        setTempGrammar('');

        const data = { "grammar": sendGrammar };

        fetch(url + "/updateGrammar", {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
            .then((response) => {
                console.log(response)
                obj.processGrammar(JSON.parse(grammarStateRef.current));
            })
            .catch(error => {
                console.error('Request to update grammar failed: ', error);
            });

    }

    const addCameraAndFilter = (grammar: string, camera: { position: number[], direction: { right: number[], lookAt: number[], up: number[] } }, filterKnots: number[]) => {

        if (grammar == '') {
            return '';
        }

        if (camera.position.length == 0 && filterKnots.length == 0) {
            return grammar;
        }

        let parsedGrammar = JSON.parse(grammar);

        for (const component of parsedGrammar.components) { // Grammar camera is the same for all map views
            if ("map" in component) {
                if (camera.position.length != 0)
                    component.map.camera = camera;

                if (filterKnots.length != 0)
                    component.map.filterKnots = filterKnots;
                else if (component.map.filterKnots != undefined)
                    delete component.map.filterKnots
            }
        }

        return JSON.stringify(parsedGrammar, null, 4);
    }

    const updateLocalNominatim = (camera: { position: number[], direction: { right: number[], lookAt: number[], up: number[] } }, filterKnots: number[]) => {
        setTempGrammar(addCameraAndFilter(grammarStateRef.current, camera, filterKnots)); // overwrite previous changes with grammar integrated with camera and filter knots
    }

    const updateCameraNominatim = (place: string) => {

        fetch(url + "/solveNominatim?text=" + place, {
            method: 'GET'
        })
            .then(async (response) => {

                let responseJson = await response.json();

                updateLocalNominatim(responseJson, filterKnots);
                setCamera(responseJson);
                d3.select('#' + linkMapAndGrammarId).property("checked", true);
            })
            .catch(error => {
                console.error('Error trying to resolve nominatim: ', error);
            });
    }



    // run only once to load the initial data
    useEffect(() => {


        let stringData = JSON.stringify(initialGrammar, null, 4);
        setCode(stringData);

        d3.select('#' + inputId).on("keydown", function (e: any) {
            if (e.key == 'Enter') {

                d3.select('#' + linkMapAndGrammarId).property("checked", false);

                let inputValue = d3.select('#' + inputId).attr("value");

                if (inputValue != undefined && !Array.isArray(inputValue)) {
                    updateCameraNominatim(inputValue.toString());
                } else {
                    throw Error("Invalid place");
                }

            }
        });

        d3.select('#' + applyGrammarButtonId).on("click", function (e: any) {
            applyGrammar();
        });

        d3.select('#' + linkMapAndGrammarId).on('change', function (e: any) {
            setRefresh(!refresh);
        });

    }, []);

    const checkIfAddCameraAndFilter = (grammar: string, camera: { position: number[], direction: { right: number[], lookAt: number[], up: number[] } }, tempGrammar: string, filterKnots: number[]) => {

        let inputLink = d3.select('#' + linkMapAndGrammarId)

        let returnedGrammar: any = {};

        if (inputLink.empty()) {
            if (tempGrammar != '') {
                returnedGrammar.text = tempGrammar;
            } else if (grammar != '') {
                returnedGrammar.json = JSON.parse(grammar);
            } else {
                returnedGrammar.json = {};
            }
            return returnedGrammar
        }

        let mapAndGrammarLinked = inputLink.property("checked");

        if (mapAndGrammarLinked) {
            let mergedGrammar = addCameraAndFilter(grammar, camera, filterKnots);

            if (mergedGrammar != '') {
                returnedGrammar.json = JSON.parse(mergedGrammar);
            } else {
                returnedGrammar.json = {};
            }

            return returnedGrammar
        } else {
            if (tempGrammar != '') {
                returnedGrammar.text = tempGrammar;
            } else if (grammar != '') {
                returnedGrammar.json = JSON.parse(grammar);
            } else {
                returnedGrammar.json = {};
            }

            return returnedGrammar;
        }
    }

    const updateGrammarContent = (grammarObj: any) => {
        if (grammarObj.text != undefined) {
            setTempGrammar(grammarObj.text);

        } else {
            setTempGrammar(JSON.stringify(grammarObj.json, null, 4));
        }

    }

    return (
        <React.Fragment>
            {showEditor && (
                <>
                    <div className="my-editor" style={{ overflow: "auto", fontSize: "24px", height: "max(90%,calc(100% - 40px))" }}>
                        {/* <div className="my-editor"> */}
                        <VanillaJSONEditor
                            content={checkIfAddCameraAndFilter(grammar, camera, tempGrammar, filterKnots)}
                            readOnly={readOnly}
                            onChange={updateGrammarContent}
                            mode={'text'}
                            indentation={4}
                        />

                    </div>
                    <div className="d-flex align-items-center justify-content-center" style={{ overflow: "auto", height: "min(10%, 40px)" }}>
                        <Button variant="secondary" id={applyGrammarButtonId} style={{ marginRight: "10px" }}>Apply Grammar</Button>
                        <input name="linkMapAndGrammar" type="checkbox" id={linkMapAndGrammarId} style={{ marginRight: "5px" }}></input>
                        <label htmlFor="linkMapAndGrammar">Link</label>
                    </div>
                </>
            )}
        </React.Fragment>
    )
}