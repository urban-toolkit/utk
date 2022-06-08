import React, {useEffect, useState} from 'react';
// css file
import './App.css';

// bootstrap elememts
import {Container, Row} from 'react-bootstrap'
// componentns
import { MapViewer } from './components/MapView/MapView';
import { WidgetsComponent } from './components/Widgets/WidgetsComponent';
import { BarChartContainer } from './components/VisComponent/BarChart/BarChartContainer';
import { ScatterPlotContainer } from './components/VisComponent/ScatterPlot/ScatterPlotContainer';
import { HeatMapContainer } from './components/VisComponent/HeatMap/HeatMapContainer';
import { useData } from './components/VisComponent/ScatterPlot/useData';
import { useHeatData } from './components/VisComponent/HeatMap/heatData';

// common variables for vis components
 // width and height of the whole SVG
 const width = window.innerWidth / 3;
 const height = window.innerHeight / 3;

// defining margin of the SVG
const margin = {top:20, right:40, bottom: 50, left:80} 

// scale offsets for nice placement
const scaleOffset = 5
const yScaleOffset = 22

// label offsets to place the labels correctly 
const xAxisLabelOffset = 40
const yAxisLabelOffset = 40


// fake data for bar chart
const barData = [
  {country: 'Russia', value: 6148},
  {country: 'Germany', value: 1653},
  {country: 'France', value: 2162},
  {country: 'China', value: 1131},
  {country: 'Spain', value: 814},
  {country: 'Netherlands', value: 1167},
  {country: 'Italy', value: 660},
  {country: 'Israel', value: 1263},
];

function App() {
  // size to maintain responsiveness
  const size = useWindowResize();
  // example iris data for scatter
  const scatterData = useData()
  // example heatmap data 
  const heatData = useHeatData()

  // state variable to handle viewing of bar chart
  const [barChartView, setBarChartView] = useState(false)
  const [scatterPlotView, setScatterPlotView] = useState(false)
  const [heatmapView, setHeatmapView] = useState(false)

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
        barChartToggle ={setBarChartView}
        scatterToggle ={setScatterPlotView}
        heatmapToggle ={setHeatmapView}
        // city data change function
        onCityRefChange = {onCityChange}
      />
      {/* map view */}
      <MapViewer 
      // variable contains which city data to load
        dataToView = {cityRef}
      />

      {/* bar chart, by default hidden */}
      <BarChartContainer
      // BOOLEAN - whether to show vis or not
        disp = {barChartView}
        data={barData}
        width={size.width}
        height={size.height}
        margin={margin}
        scaleOffset={scaleOffset}
        yScaleOffset={yScaleOffset}
        xAxisLabelOffset={xAxisLabelOffset}
        yAxisLabelOffset={yAxisLabelOffset}
      />

      {/* scatter plot, by default hidden */}
      <ScatterPlotContainer
        // BOOLEAN - whether to show vis or not
        disp = {scatterPlotView}
        data={scatterData}
        width={size.width}
        height={size.height}
        margin={margin}
        scaleOffset={scaleOffset}
        yScaleOffset={yScaleOffset}
        xAxisLabelOffset={xAxisLabelOffset}
        yAxisLabelOffset={yAxisLabelOffset}
      />

      {/* heatmap, by default hidden */}
      <HeatMapContainer
        // BOOLEAN - whether to show vis or not
        disp = {heatmapView}
        data = {heatData}
        width={size.width}
        height={size.height}
        margin={margin}
        scaleOffset={scaleOffset}
        yScaleOffset={yScaleOffset}
        xAxisLabelOffset={xAxisLabelOffset}
        yAxisLabelOffset={yAxisLabelOffset}
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

export default App;
