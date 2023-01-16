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

function App() {
  // size to maintain responsiveness
  const size = useWindowResize();

  const svgId = "genericPlotSvg";

  const [genericPlots, setGenericPlots] = useState([{id: 0, hidden: true, svgId: "genericPlotSvg0"}])

  const addNewGenericPlot = (newPlotId: number) => {
    setGenericPlots(genericPlots.concat([{id: newPlotId, hidden: true, svgId: "genericPlotSvg"+newPlotId}]));
  }

  const toggleGenericPlot = (plotId: number) => {
    let modifiedPlots = [];
    for(const plot of genericPlots){
      if(plot.id == plotId){
        modifiedPlots.push({id: plot.id, hidden: !plot.hidden, svgId: plot.svgId});
      }else{
        modifiedPlots.push({id: plot.id, hidden: plot.hidden, svgId: plot.svgId});
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
        // city data change function
        onCityRefChange = {onCityChange}
      />
      {/* map view */}
      <MapViewer 
      // variable contains which city data to load
        dataToView = {cityRef}
        divWidth = {11}
        screenPlotSvgId = {svgId}
      />

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

export default App;

