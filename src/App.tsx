import React from 'react';
import './App.css';

import {Container, Row} from 'react-bootstrap'
import { MapView } from './components/MapView/MapView';
import { WidgetsComponent } from './components/Widgets/WidgetsComponent';
import { BarChart } from './components/VisComponent/BarChart';
import {useState} from 'react';


function App() {
  // state variable to handle viewing of bar chart
  let [barChartView, setBarChartView] = useState(false)

  return (
    <Container fluid>
      <Row>
        {/* widgets component */}
      <WidgetsComponent
        barChartToggle ={setBarChartView}
      />
      {/* map view */}
      <MapView />
      {/* bar chart, by default hiddent */}
      <BarChart
        disp = {barChartView}
      />
        
      </Row>
    </Container>
  );
}

export default App;
