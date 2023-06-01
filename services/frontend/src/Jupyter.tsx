import React, {useEffect, useState} from 'react';
// useEffect hooks lets you perform side effects in function component
// useState is a Hook that lets you add React state to function components
// https://reactjs.org/docs/hooks-state.html

// css file
import './App.css';

// bootstrap elememts
import {Container, Row} from 'react-bootstrap'
// componentns
// import { MapViewer, setCameraPosMap } from './components/MapView/MapView';
// import { WidgetsComponent } from './components/Widgets/WidgetsComponent';

// import { GenericScreenPlotContainer } from './utk-map/ts/src/reactComponents/GenericScreenPlotContainer';

import * as d3 from "d3";

// common variables for vis components
// width and height of the whole SVG 
//  are calculated using useWindowResize function
// at the end of this file

// defining margin of the SVG
const margin = {top:20, right:40, bottom: 50, left:80} 

// scale offsets for nice placement
const scaleOffset = 5
const yScaleOffset = 22

// label offsets to place the labels correctly 
const xAxisLabelOffset = 40
const yAxisLabelOffset = 40

function Jupyter(data: { bar: any; scatter: any; heat: any; city:any }) {
  // size to maintain responsiveness
  const size = useWindowResize();

  const [genericPlots, setGenericPlots] = useState<{id: number, hidden: boolean, svgId: string, label: string, checked: boolean, edit: boolean}[]>([]);
  const [currentPlotId, setCurrentPlotId] = useState(0);
  const [plotCollectionList, setPlotCollectionList] = useState<{id: number, content: string}[]>([]);
  const [systemMessages, setSystemMessages] = useState<{text: string, color: string}[]>([]);
  const [camera, setCamera] = useState<{position: number[], direction: {right: number[], lookAt: number[], up: number[]}}>({position: [], direction: {right: [], lookAt: [], up: []}});

  let inputBarId = "searchBar";

  const addNewGenericPlot = (n: number = 1) => {

    let tempId = currentPlotId;
    let createdIds = [];
    let tempPlots = [];

    for(let i = 0; i < n; i++){
      tempPlots.push({id: tempId, hidden: false, svgId: "genericPlotSvg"+tempId, label: "Generic Plot", checked: false, edit: false});
      createdIds.push(tempId);
      tempId += 1;
    }

    setGenericPlots(genericPlots.concat(tempPlots));
    setCurrentPlotId(tempId);
    return createdIds;
  }

  const updateCamera = (cameraData: {position: number[], direction: {right: number[], lookAt: number[], up: number[]}}) => {
    setCamera(cameraData);
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

  // data handler - by default load chicago data
  const [cityRef, setCityRef] = useState('none')
  const [showPlotCollection, setShowPlotCollection] = useState(false);

  /**
   * data handler function - on radio button change save the value of the city
   * @param event 
   */
  const onCityChange = (event: React.ChangeEvent<HTMLInputElement>) =>{
    setCityRef(event.target.value);
    // console.log(event.target)
  }

  const togglePlotCollection = () => {
    setShowPlotCollection(!showPlotCollection);
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

  const linkedContainerGenerator = (n: number) => {
    let createdIds = addNewGenericPlot(n);

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
    <Container fluid>
      <Row>
        {/* widgets component */}
      {/* <WidgetsComponent
        camera = {camera}
        inputId = {inputBarId}
        setCamera = {setCameraPosMap}
        addNewMessage = {addNewMessage}
        applyGrammarButtonId = {"applyGrammarButton"}
        linkMapAndGrammarId = {"linkMapAndGrammar"}
      /> */}
      {/* map view */}
      {/* <MapViewer 
        dataToView = {'none'}
        divWidth = {9}
        d3App = {d3App}
        linkedContainerGenerator = {linkedContainerGenerator}
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
      /> */}

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
    </Container>
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

export default Jupyter;

