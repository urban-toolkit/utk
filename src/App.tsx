import React from 'react';
import './App.css';

import {Container, Row} from 'react-bootstrap'
import { MapView } from './components/MapView/MapView';
import { WidgetsComponent } from './components/Widgets/WidgetsComponent';
import { BarChart } from './components/VisComponent/BarChart';
import {useState} from 'react';


function App() {
  let [barChartView, setBarChartView] = useState(false)

  return (
    <Container fluid>
      <Row>
      <WidgetsComponent
        barChartToggle ={setBarChartView}
      />
      <MapView />
      <BarChart
        disp = {barChartView}
      />
        
      </Row>
    </Container>
  );
}

export default App;
