import React, {useEffect, useState} from 'react';
// useEffect hooks lets you perform side effects in function component
// useState is a Hook that lets you add React state to function components
// https://reactjs.org/docs/hooks-state.html

// css file
import './App.css';

// bootstrap elememts
import {Container, Row} from 'react-bootstrap'
// componentns
import { MapViewer } from './components/MapView/MapView';
import { WidgetsComponent } from './components/Widgets/WidgetsComponent';

import { GenericScreenPlotContainer } from './components/VisComponent/GenericScreenPlot/GenericScreenPlotContainer';

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


// fake data for bar chart
// const barData = [
//   {country: 'Russia', value: 6148},
//   {country: 'Germany', value: 1653},
//   {country: 'France', value: 2162},
//   {country: 'China', value: 1131},
//   {country: 'Spain', value: 814},
//   {country: 'Netherlands', value: 1167},
//   {country: 'Italy', value: 660},
//   {country: 'Israel', value: 1263},
// ];

function Jupyter(data: { bar: any; scatter: any; heat: any; city:any }) {
  // size to maintain responsiveness
  const size = useWindowResize();

  const svgId = "genericPlotSvg";

  const [genericScreenPlotView, setGenericScreenPlotView] = useState(false)

  // data handler - by default load chicago data
  const [cityRef, setCityRef] = useState('none')

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
        genericScreenPlotToggle ={setGenericScreenPlotView}
        // city data change function
        onCityRefChange = {onCityChange}
      />
      {/* map view */}
      <MapViewer 
        dataToView = {'none'}
        divWidth = {11}
        screenPlotSvgId = {svgId}
        data = {data.city}
      />

      {/* generic plot, by default hidden */}
      <GenericScreenPlotContainer
      // BOOLEAN - whether to show vis or not
        disp = {genericScreenPlotView}
        width={size.width}
        height={size.height}
        svgId={svgId}
      />

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

