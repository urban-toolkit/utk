import React from 'react';
import './App.css';

import {Container, Row} from 'react-bootstrap'
import { MapView } from './components/MapView/MapView';
import { WidgetsComponent } from './components/Widgets/WidgetsComponent';


function App() {
  return (
    <Container fluid>
      <Row>
        <MapView></MapView>
        <WidgetsComponent></WidgetsComponent>
      </Row>
    </Container>
  );
}

export default App;
