import React from 'react';
import './App.css';

import {Container, Row} from 'react-bootstrap'
import { MapView } from './components/MapView/MapView';
import { WidgetsComponent } from './components/Widgets/WidgetsComponent';


function App() {
  return (
    <Container fluid>
      <Row>
      <WidgetsComponent></WidgetsComponent>
        <MapView></MapView>
        
      </Row>
    </Container>
  );
}

export default App;
