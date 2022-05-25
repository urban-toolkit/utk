import React from 'react';
import './App.css';

import {Container, Row} from 'react-bootstrap'
import { MapView } from './components/MapView/MapView';
import { WidgetsComponent } from './components/Widgets/WidgetsComponent';
import { BarChart } from './components/VisComponent/BarChart/BarChart';
import {useState} from 'react';
import { ScatterPlot } from './components/VisComponent/ScatterPlot/ScatterPlot';
import { HeatMap } from './components/VisComponent/HeatMap/HeatMap';
import { scaleLinear } from 'd3';


function App() {
  // state variable to handle viewing of bar chart
  let [barChartView, setBarChartView] = useState(false)
  let [scatterPlotView, setScatterPlotView] = useState(false)
  let [heatmapView, setHeatmapView] = useState(false)

  const scale = scaleLinear()
  .range([0,10])
  .domain([5,100])

  return (
    <Container fluid>
      <Row>
        {/* widgets component */}
      <WidgetsComponent
        barChartToggle ={setBarChartView}
        scatterToggle ={setScatterPlotView}
        heatmapToggle ={setHeatmapView}
      />
      {/* map view */}
      <MapView />
      {/* bar chart, by default hiddent */}
      <BarChart
        disp = {barChartView}
        scale = {scale}
      />

      <ScatterPlot
        disp = {scatterPlotView}
      />

      <HeatMap
        disp = {heatmapView}
      />
        
      </Row>
    </Container>
  );
}

export default App;
