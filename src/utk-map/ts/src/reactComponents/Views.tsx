import React, {useEffect, useState} from 'react';
import {Container, Row, Col} from 'react-bootstrap'
import { GrammarPanelContainer } from './GrammarPanel';
import { MapRendererContainer } from './MapRenderer';
import { GenericScreenPlotContainer } from './GenericScreenPlotContainer';
import { ComponentIdentifier} from '../constants';

import * as d3 from "d3";
import { IComponentPosition, IGrammar, IGrid } from '../interfaces';

// declaring the types of the props
type ViewProps = {
  viewObjs: {type: ComponentIdentifier, obj: any, position: IComponentPosition}[] // each view has a an object representing its logic
  viewIds: string[]
  grammar: IGrammar
  mainDivSize: {width: number, height: number}
}

function Views({viewObjs, viewIds, grammar, mainDivSize}: ViewProps) {

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

  const getSizes = (position: IComponentPosition) => {
    let widthPercentage = (position.width[1]+1-position.width[0])/grammar.grid.width;
    let heightPercentage = (position.height[1]+1-position.height[0])/grammar.grid.height;

    return {width: widthPercentage*mainDivSize.width, height: heightPercentage*mainDivSize.height};
  }

  const getTopLeft = (position: IComponentPosition) => {

    let leftPercentange = (position.width[0]-1)/grammar.grid.width;
    let topPercentange = (position.height[0]-1)/grammar.grid.height;

    return {top: topPercentange*mainDivSize.height, left: leftPercentange*mainDivSize.width}
  }

  useEffect(() => {
    for(let i = 0; i < viewObjs.length; i++){
      let viewObj = viewObjs[i].obj;
      let viewId = viewIds[i];

      viewObj.init(viewId, updateStatus);
    }
  }, []);

  return (
    <React.Fragment>
      <Row style={{margin: 0}}>
        {
          viewObjs.map((component, index) => {
          if (component.type == ComponentIdentifier.MAP) {
            return <React.Fragment key={viewIds[index]}>
              <div style={{position: "absolute", left: getTopLeft(component.position).left, top: getTopLeft(component.position).top, width: getSizes(component.position).width, height: getSizes(component.position).height}}>
                <MapRendererContainer
                  obj = {component.obj}
                  viewId={viewIds[index]}
                  divWidth = {7}
                  inputId = {inputBarId}
                  systemMessages = {systemMessages}
                  applyGrammarButtonId = {"applyGrammarButton"}
                  genericScreenPlotToggle ={toggleGenericPlot}
                  listPlots = {genericPlots}
                  linkMapAndGrammarId = {"linkMapAndGrammar"}
                  listLayers = {layersIds}
                />
              </div>
            </React.Fragment>
          } else if(component.type == ComponentIdentifier.GRAMMAR) {
            return <React.Fragment key={viewIds[index]}>
              <div style={{position: "absolute", left: getTopLeft(component.position).left, top: getTopLeft(component.position).top, width: getSizes(component.position).width, height: getSizes(component.position).height}}>
                <GrammarPanelContainer 
                  obj = {component.obj}
                  viewId={viewIds[index]}
                  initialGrammar={grammar}
                  camera = {camera}
                  filterKnots = {filterKnots}
                  inputId = {inputBarId}
                  setCamera = {setCamera}
                  addNewMessage = {addNewMessage}
                  applyGrammarButtonId = {"applyGrammarButton"}
                  linkMapAndGrammarId = {"linkMapAndGrammar"}
                />
              </div>
            </React.Fragment>
          }
          })
        }

        {/* <Col md={5} style={{padding: "0"}}>
          <GrammarPanelContainer 
            obj = {viewObjs[1]}
            initialGrammar={grammar}
            camera = {camera}
            filterKnots = {filterKnots}
            inputId = {inputBarId}
            setCamera = {setCamera}
            addNewMessage = {addNewMessage}
            applyGrammarButtonId = {"applyGrammarButton"}
            linkMapAndGrammarId = {"linkMapAndGrammar"}
          />
        </Col> */}
        {/* <Col md={7} style={{padding: 0}}>
          <MapRendererContainer
            obj = {viewObjs[0]}
            viewId={viewIds[0]}
            divWidth = {7}
            inputId = {inputBarId}
            systemMessages = {systemMessages}
            applyGrammarButtonId = {"applyGrammarButton"}
            genericScreenPlotToggle ={toggleGenericPlot}
            listPlots = {genericPlots}
            linkMapAndGrammarId = {"linkMapAndGrammar"}
            listLayers = {layersIds}
          />
        </Col> */}
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

