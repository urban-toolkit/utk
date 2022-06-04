import React, {useState} from 'react';
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


function App() {
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
      />

      {/* scatter plot, by default hidden */}
      <ScatterPlotContainer
        // BOOLEAN - whether to show vis or not
        disp = {scatterPlotView}
      />

      {/* heatmap, by default hidden */}
      <HeatMapContainer
        // BOOLEAN - whether to show vis or not
        disp = {heatmapView}
      />
        
      </Row>
    </Container>
  );
}

export default App;
