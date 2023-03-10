import React, {useEffect, useState} from 'react';
// useEffect hooks lets you perform side effects in function component
// useState is a Hook that lets you add React state to function components
// https://reactjs.org/docs/hooks-state.html

// css file
import './App.css';

// bootstrap elememts
import {Container, Row} from 'react-bootstrap'
// componentns
import { MapViewer, setCameraPosMap } from './components/MapView/MapView';
import { WidgetsComponent } from './components/Widgets/WidgetsComponent';

import { GenericScreenPlotContainer } from './components/VisComponent/GenericScreenPlot/GenericScreenPlotContainer';
import { PlotCollectionContainer } from './components/Widgets/PlotCollection';
import { PlotSpecificationContainer } from './components/Widgets/PlotSpecification';

import { D3AppFactory } from './components/MapView/D3App';
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
  let inputBarId = "searchBar";

  const d3App = D3AppFactory.getInstance();
  d3App.resetD3App('#svg_element', "#genericPlotSvg0", plotCollectionList);
  
  const addNewGenericPlot = (n: number = 1) => {

    let createdIds = [];
    let tempPlots = [];

    let tempId = 0;

    for(let i = 0; i < n; i++){
      tempPlots.push({id: tempId, hidden: true, svgId: "genericPlotSvg"+tempId, label: "Plot "+tempId, checked: false, edit: false});
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

  const linkedContainerGenerator = (n: number) => {

    let createdIds: number[] = [];

    createdIds = addNewGenericPlot(n);

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

  const addSpecInCollection = (specObj: {id: number, content: string}) => {
    
    d3App.updatePlotCollectionList(plotCollectionList.concat(specObj));

    setPlotCollectionList(plotCollectionList.concat(specObj));

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

  // data handler - by default load chicago data
  const [cityRef, setCityRef] = useState('Chicago')

  /**
   * data handler function - on radio button change save the value of the city
   * @param event 
   */
  const onCityChange = (event: React.ChangeEvent<HTMLInputElement>) =>{
    setCityRef(event.target.value);
    // console.log(event.target)
  }


  return (
    <Container fluid>
      <Row>
        {/* widgets component */}
      <WidgetsComponent
        // visualization toggle varibles 
        genericScreenPlotToggle ={toggleGenericPlot}
        addGenericPlot = {addNewGenericPlot}
        removeGenericPlot = {removeGenericPlot}
        togglePlotCollection = {togglePlotCollection}
        // city data change function
        onCityRefChange = {onCityChange}
        listPlots = {genericPlots}
        modifyLabelPlot = {modifyLabelPlot}
        modifyEditingState = {modifyEditingState}
        camera = {camera}
        inputId = {inputBarId}
        setCamera = {setCameraPosMap}
      />
      {/* map view */}
      <MapViewer 
      // variable contains which city data to load
        dataToView = {cityRef}
        divWidth = {7}
        d3App = {d3App}
        linkedContainerGenerator = {linkedContainerGenerator}
        cameraUpdateCallback = {updateCamera}
        inputId = {inputBarId}
      />

      {/* <PlotCollectionContainer 
        disp = {showPlotCollection}
        togglePlotSpec = {togglePlotSpec}
        collection = {plotCollectionList}
      /> */}

      {/* <PlotSpecificationContainer
        disp = {showPlotSpec}
        addSpecInCollection = {addSpecInCollection}
      /> */}

      </Row>

      {
        genericPlots.map((item) => (
            <GenericScreenPlotContainer
              key={item.id}
              disp = {!item.hidden}
              width={size.width}
              height={size.height}
              svgId={item.svgId}
            />
        ))
      }
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

export default App;

