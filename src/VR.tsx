import React, {useEffect, useState} from 'react';
// useEffect hooks lets you perform side effects in function component
// useState is a Hook that lets you add React state to function components
// https://reactjs.org/docs/hooks-state.html

// css file
import './App.css';

// bootstrap elememts
import {Container} from 'react-bootstrap'
// componentns
// import { MapViewer } from './components/MapView/MapView';


const VR = () => {  

   // data handler - by default load chicago data
   const [cityRef, setCityRef] = useState('Chicago')
  
    return (
      <Container fluid>
        {/* map view */}
        {/* TODO: work on VR interface */}
        {/* <MapViewer 
        // variable contains which city data to load
          dataToView = {cityRef}
          divWidth = {12}
          frontEndMode = {'vr'}
        /> */}
      </Container>
    );
  }

export default VR;