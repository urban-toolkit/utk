import React from 'react';
import './App.css';

import {Container, Row} from 'react-bootstrap'
import { MapViewer } from './components/MapView/MapView';
import { WidgetsComponent } from './components/Widgets/WidgetsComponent';
import { BarChart } from './components/VisComponent/BarChart/BarChart';
import {useState} from 'react';
import { ScatterPlot } from './components/VisComponent/ScatterPlot/ScatterPlot';
import { HeatMap } from './components/VisComponent/HeatMap/HeatMap';


function App() {
  // state variable to handle viewing of bar chart
  const [barChartView, setBarChartView] = useState(false)
  const [scatterPlotView, setScatterPlotView] = useState(false)
  const [heatmapView, setHeatmapView] = useState(false)

  const [cityRef, setCityRef] = useState('Chicago')

  const onCityChange = (event: React.ChangeEvent<HTMLInputElement>) =>{
    setCityRef(event.target.value);
    // console.log(event.target)
  }

  return (
    <Container fluid>
      <Row>
        {/* widgets component */}
      <WidgetsComponent
        barChartToggle ={setBarChartView}
        scatterToggle ={setScatterPlotView}
        heatmapToggle ={setHeatmapView}
        onCityRefChange = {onCityChange}
      />
      {/* map view */}
      <MapViewer 
        dataToView = {cityRef}
      />

      {/* bar chart, by default hidden */}
      <BarChart
        disp = {barChartView}
      />

      {/* scatter plot, by default hidden */}
      <ScatterPlot
        disp = {scatterPlotView}
      />

      {/* heatmap, by default hidden */}
      <HeatMap
        disp = {heatmapView}
      />
        
      </Row>
    </Container>
  );
}

export default App;
