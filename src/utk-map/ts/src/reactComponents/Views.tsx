import React, {useEffect, useState} from 'react';
import {Container, Row, Col} from 'react-bootstrap'
import { GrammarPanelContainer } from './GrammarPanel';
import { MapRendererContainer } from './MapRenderer';

import * as d3 from "d3";

// declaring the types of the props
type ViewProps = {
  viewObjs: any[] // each view has a an object representing its logic
}

function Views({viewObjs}: ViewProps) {

  const [camera, setCamera] = useState<{position: number[], direction: {right: number[], lookAt: number[], up: number[]}}>({position: [], direction: {right: [], lookAt: [], up: []}}); // TODO: if we have multiple map instances we have multiple cameras
  const [filterKnots, setFilterKnots] = useState<number[]>([]);
  const [systemMessages, setSystemMessages] = useState<{text: string, color: string}[]>([]);
  const [genericPlots, setGenericPlots] = useState<{id: number, hidden: boolean, svgId: string, label: string, checked: boolean, edit: boolean}[]>([]);
  const [currentPlotId, setCurrentPlotId] = useState(0);
  const [layersIds, setLayersIds] = useState<string[]>([]);
  let inputBarId = "searchBar";

  const addNewMessage = (msg: string, color: string) => {
    setSystemMessages([{text: msg, color: color}]);
  }

  const linkedContainerGenerator = (n: number, names: string[] = []) => {

    let createdIds: number[] = [];

    createdIds = addNewGenericPlot(n, names);

    // promise is only resolved when the container is created
    return new Promise(async function (resolve, reject) {

      let checkContainer = async () => {

        let allContainersCreated = true;

        for(const id of createdIds){
          if(d3.select("#"+"genericPlotSvg"+id).empty()){
            allContainersCreated = false;
            break;
          }
        }

        if(!allContainersCreated) { // the container was not create yet or the state still needs to be updated
            await new Promise(r => setTimeout(r, 100));
            checkContainer();
        }
      }
    
      await checkContainer();

      let returnIds = [];

      for(const id of createdIds){
        returnIds.push("genericPlotSvg"+id);
      }

      resolve(returnIds);

    });

  }

  const addNewGenericPlot = (n: number = 1, names: string[] = []) => {

    let createdIds = [];
    let tempPlots = [];

    let tempId = 0;

    for(let i = 0; i < n; i++){
      if(names.length > 0 && names[i] != '' && names[i] != undefined){
        tempPlots.push({id: tempId, hidden: true, svgId: "genericPlotSvg"+tempId, label: names[i], checked: false, edit: false});
      }else{
        tempPlots.push({id: tempId, hidden: true, svgId: "genericPlotSvg"+tempId, label: "Plot "+tempId, checked: false, edit: false});
      }
      createdIds.push(tempId);
      tempId += 1;
    }

    setGenericPlots(tempPlots);
    setCurrentPlotId(tempId);
    return createdIds;
  }

  const toggleGenericPlot = (plotId: number) => {
    let modifiedPlots = [];
    for(const plot of genericPlots){
      if(plot.id == plotId){
        modifiedPlots.push({id: plot.id, hidden: !plot.hidden, svgId: plot.svgId, label: plot.label, checked: plot.checked, edit: plot.edit});
      }else{
        modifiedPlots.push({id: plot.id, hidden: plot.hidden, svgId: plot.svgId, label: plot.label, checked: plot.checked, edit: plot.edit});
      }
    }
    setGenericPlots(modifiedPlots);
  }

  /**
   * Summarize callbacks
   */
  const updateStatus = (state: string, value: any) => {
    if(state == "camera"){
      setCamera(value);
    }else if(state == "filterKnots"){
      setFilterKnots(value);
    }else if(state == "systemMessages"){
      setSystemMessages(value);
    }else if(state == "genericPlots"){
      setGenericPlots(value);
    }else if(state == "layersIds"){
      setLayersIds(value);
    }else if(state == "containerGenerator"){
      return linkedContainerGenerator(value.n, value.names);
    }
  }

  useEffect(() => {
    for(const viewObj of viewObjs){
      viewObj.setUpdateStatusCallback(updateStatus);
    }
  }, []);

  return (
    <React.Fragment>
      <Row style={{margin: 0}}>
        <Col md={5} style={{padding: "0"}}>
          <GrammarPanelContainer 
            camera = {camera}
            filterKnots = {filterKnots}
            inputId = {inputBarId}
            setCamera = {setCamera}
            addNewMessage = {addNewMessage}
            applyGrammarButtonId = {"applyGrammarButton"}
            linkMapAndGrammarId = {"linkMapAndGrammar"}
          />
        </Col>
        <Col md={7} style={{padding: 0}}>
          <MapRendererContainer
            viewId={0}
            divWidth = {7}
            inputId = {inputBarId}
            systemMessages = {systemMessages}
            applyGrammarButtonId = {"applyGrammarButton"}
            genericScreenPlotToggle ={toggleGenericPlot}
            listPlots = {genericPlots}
            linkMapAndGrammarId = {"linkMapAndGrammar"}
            listLayers = {layersIds}
          />
        </Col>
        {/* {
        genericPlots.map((item) => (
            <GenericScreenPlotContainer
              key={item.id}
              disp = {!item.hidden}
              svgId={item.svgId}
            />
        ))
        } */}
      </Row>
    </React.Fragment>
  );
}

export default Views;

