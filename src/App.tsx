import React, {useEffect, useState} from 'react';
// useEffect hooks lets you perform side effects in function component
// useState is a Hook that lets you add React state to function components
// https://reactjs.org/docs/hooks-state.html

// css file
import './App.css';

// bootstrap elememts
import {Container, Row, Col} from 'react-bootstrap'
// componentns
import { MapViewer, setCameraPosMap } from './components/MapView/MapView';
import { WidgetsComponent } from './components/Widgets/WidgetsComponent';

import { GenericScreenPlotContainer } from './components/VisComponent/GenericScreenPlot/GenericScreenPlotContainer';

import * as d3 from "d3";

const pythonServerParams = require('./pythonServerConfig.json');


// common variables for vis components
// width and height of the whole SVG 
//  are calculated using useWindowResize function
// at the end of this file

function App() {
  // size to maintain responsiveness
  const size = useWindowResize();

  const [genericPlots, setGenericPlots] = useState<{id: number, hidden: boolean, svgId: string, label: string, checked: boolean, edit: boolean}[]>([]);

  const [showPlotCollection, setShowPlotCollection] = useState(false);
  const [showPlotSpec, setShowPlotSpec] = useState(false);
  const [plotCollectionList, setPlotCollectionList] = useState<{id: number, content: string}[]>([]);
  const [currentPlotId, setCurrentPlotId] = useState(0)
  const [camera, setCamera] = useState<{position: number[], direction: {right: number[], lookAt: number[], up: number[]}}>({position: [], direction: {right: [], lookAt: [], up: []}});
  const [filterKnots, setFilterKnots] = useState<number[]>([]);
  const [systemMessages, setSystemMessages] = useState<{text: string, color: string}[]>([]);
  const [layersIds, setLayersIds] = useState<string[]>([]);
  let inputBarId = "searchBar";

  const listLayersCallback = (ids:string[]) => {
    setLayersIds(ids);
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

  const updateCamera = (cameraData: {position: number[], direction: {right: number[], lookAt: number[], up: number[]}}) => {
    setCamera(cameraData);
  }

  const updateFilterKnots = (filterKnots: number[]) => {
    setFilterKnots(filterKnots);
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
  
  const removeGenericPlot = (plotId: number) => {
    let modifiedPlots = [];
    for(const plot of genericPlots){
      if(plot.id != plotId){
        modifiedPlots.push({id: plot.id, hidden: plot.hidden, svgId: plot.svgId, label: plot.label, checked: plot.checked, edit: plot.edit});
      }
    }
    setGenericPlots(modifiedPlots);    
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

  const togglePlotCollection = () => {
    setShowPlotCollection(!showPlotCollection);
  }

  const togglePlotSpec = () => {
    setShowPlotSpec(!showPlotSpec);
  }

  const modifyLabelPlot = (newName: string, plotId: number) => {
    let modifiedPlots = [];
    
    for(const plot of genericPlots){
        if(plot.id == plotId){
            modifiedPlots.push({id: plot.id, hidden: plot.hidden, svgId: plot.svgId, label: newName, checked: plot.checked, edit: plot.edit});
        }else{
            modifiedPlots.push({id: plot.id, hidden: plot.hidden, svgId: plot.svgId, label: plot.label, checked: plot.checked, edit: plot.edit});
        }
    }

    setGenericPlots(modifiedPlots);
  }

  const modifyEditingState = (plotId: number) => {
    let modifiedPlots = [];
    
    for(const plot of genericPlots){
        if(plot.id == plotId){
            modifiedPlots.push({id: plot.id, hidden: plot.hidden, svgId: plot.svgId, label: plot.label, checked: plot.checked, edit: !plot.edit});
        }else{
            modifiedPlots.push({id: plot.id, hidden: plot.hidden, svgId: plot.svgId, label: plot.label, checked: plot.checked, edit: plot.edit});
        }
    }

    setGenericPlots(modifiedPlots);
  }

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

  return (
    // <Container fluid style={{padding: 0}}>
    <React.Fragment>
      <Row style={{margin: 0}}>
        {/* widgets component */}
        <WidgetsComponent
          camera = {camera}
          filterKnots = {filterKnots}
          inputId = {inputBarId}
          setCamera = {setCameraPosMap}
          addNewMessage = {addNewMessage}
          applyGrammarButtonId = {"applyGrammarButton"}
          linkMapAndGrammarId = {"linkMapAndGrammar"}
        />
        {/* map view */}
        <Col md={7} style={{padding: 0}}>
          {/* <MapViewer 
          // variable contains which city data to load
            divWidth = {7}
            linkedContainerGenerator = {linkedContainerGenerator}
            cameraUpdateCallback = {updateCamera}
            filterKnotsUpdateCallback = {updateFilterKnots}
            inputId = {inputBarId}
            systemMessages = {systemMessages}
            applyGrammarButtonId = {"applyGrammarButton"}
            genericScreenPlotToggle ={toggleGenericPlot}
            addGenericPlot = {addNewGenericPlot}
            removeGenericPlot = {removeGenericPlot}
            togglePlotCollection = {togglePlotCollection}
            listPlots = {genericPlots}
            modifyLabelPlot = {modifyLabelPlot}
            modifyEditingState = {modifyEditingState}
            linkMapAndGrammarId = {"linkMapAndGrammar"}
            listLayersCallback = {listLayersCallback}
            listLayers = {layersIds}
          /> */}
        </Col>

      </Row>

      {
        genericPlots.map((item) => (
            <GenericScreenPlotContainer
              key={item.id}
              disp = {!item.hidden}
              svgId={item.svgId}
            />
        ))
      }
    </React.Fragment>
    // </Container>
  );
}


// making responsive
function useWindowResize(){
  // Initialize state with undefined width/height so server and client renders match
  // Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth / 3,
    height: window.innerHeight / 3,
  });

  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      setWindowSize({
        width: window.innerWidth / 3,
        height: window.innerHeight / 3,
      });
    }
    // Add event listener
    window.addEventListener("resize", handleResize);
    // Call handler right away so state gets updated with initial window size
    handleResize();
    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty array ensures that effect is only run on mount
  return windowSize;
}

export default App;

