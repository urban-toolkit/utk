import React, {useEffect, useState} from 'react';
// useEffect hooks lets you perform side effects in function component
// useState is a Hook that lets you add React state to function components
// https://reactjs.org/docs/hooks-state.html

// css file
import '../App.css';

// bootstrap elememts
import {Container, Row} from 'react-bootstrap'
// componentns
// import { MapViewer } from './MapView/MapView';
import { MapViewer } from './MapView/MapView';
import { WidgetsComponent } from './Widgets/WidgetsComponent';
import { BarChartContainer } from './VisComponent/BarChart/BarChartContainer';
import { ScatterPlotContainer } from './VisComponent/ScatterPlot/ScatterPlotContainer';
import { HeatMapContainer } from './VisComponent/HeatMap/HeatMapContainer';
import { useData } from './VisComponent/ScatterPlot/useData';
import { useHeatData } from './VisComponent/HeatMap/heatData';
import { useBarData } from './VisComponent/BarChart/useBarData';

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

export default function Thing(props) {
  // size to maintain responsiveness
  const size = {width: 1000,
  height: 700}
  //example bar data for barchart
  const barData = useBarData()

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
  const onCityChange = (event) =>{
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
        divWidth = {11}
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

// export default Thing;

