import React, { useState, useEffect, useRef } from "react";
import { Form } from "react-bootstrap";
import {Container, Row, Col} from 'react-bootstrap'

import './ResolutionWidget.css';

type ResolutionWidgetProps = {
    listLayers: string[]
    obj: any // map 
    viewId: string
    camera: {position: number[], direction: {right: number[], lookAt: number[], up: number[]}}
}

export const ResolutionWidget = ({obj, listLayers, viewId, camera}:ResolutionWidgetProps) =>{

  const [checkedLayers, setCheckedLayers] = useState<string[]>([]);

  const updateCheckedLayers = (id: string) => {

    let newCheckedLayers = [];

    for(const layer of checkedLayers){
      if(layer != id){
        newCheckedLayers.push(layer);
      }
    }

    if(!checkedLayers.includes(id)){ // add
      newCheckedLayers.push(id);
    }

    setCheckedLayers(newCheckedLayers);
  }

  return(
    <React.Fragment>
      <Row style={{margin: 0}}>
        <div style={{height: "60px", overflowY: "auto", padding: "5px"}} id={"resolution_widget_"+viewId}>
            {
                listLayers.map((item) => (
                    <Form.Check key={item} type="checkbox" label={item} id={'resolution_'+item} onChange={() => {updateCheckedLayers(item)}}/> 
                ))
            }
            
        </div>
        <ul>
          {
              checkedLayers.map((item) => (
                <li key={item}>{item}</li>
              ))
          }
        </ul>
      </Row>
    </React.Fragment>
  )
}