import React, { useState, useEffect, useRef } from "react";
import { Form } from "react-bootstrap";
import {Container, Row, Col} from 'react-bootstrap'

import './ResolutionWidget.css';

type ResolutionWidgetProps = {
    obj: any // map 
    listLayers: string[]
    viewId: string
    camera: {position: number[], direction: {right: number[], lookAt: number[], up: number[]}}
    title: string | undefined
    subtitle: string | undefined
}

export const ResolutionWidget = ({obj, listLayers, viewId, camera, title, subtitle}:ResolutionWidgetProps) =>{

  const [checkedLayers, setCheckedLayers] = useState<string[]>([]);
  const [knotVisibilityMonitor, setKnotVisibilityMonitor] = useState<any>();
 
  const [cameraState, _setCameraState] = useState<any>();
  const cameraStateRef = useRef(cameraState);
  const setCameraState = (data: any) => {
    cameraStateRef.current = data;
    _setCameraState(data);
  };


  const [startEndResolution, _setStartEndResolution] = useState<{id: string, start: number | null, end: number | null}[]>([]);
  const startEndResolutionRef = useRef(startEndResolution);
  const setStartEndResolution = (data: any) => {
    startEndResolutionRef.current = data;
      _setStartEndResolution(data);
  };

  const updateCheckedLayers = (id: string) => {

    let newCheckedLayers = [];

    for(const layer of checkedLayers){
      if(layer != id){
        newCheckedLayers.push(layer);
      }
    }
    
    let newObject = [];
    
    if(!checkedLayers.includes(id)){ // add
      newCheckedLayers.push(id);
      newObject.push({id: id, start: null, end: null})  
    }

    
    for(const resolutionRange of startEndResolutionRef.current){
      if(newCheckedLayers.includes(resolutionRange.id)){
        newObject.push({id: resolutionRange.id, start: resolutionRange.start, end: resolutionRange.end})
      }
    }

    setStartEndResolution(newObject);
    setCheckedLayers(newCheckedLayers);
  }

  useEffect(() => {

    if(knotVisibilityMonitor != undefined){
        clearInterval(knotVisibilityMonitor);
    }
    
    setKnotVisibilityMonitor(window.setInterval(function(){

      if(startEndResolutionRef.current.length == 0)
        return;

      for(const resolutionRange of startEndResolutionRef.current){
        if(resolutionRange.start != null && resolutionRange.end != null && cameraStateRef.current.position[2] >= resolutionRange.start && cameraStateRef.current.position[2] <= resolutionRange.end){
          obj.toggleKnot(resolutionRange.id, true);
        }else{
          obj.toggleKnot(resolutionRange.id, false);
        }
      }

    }, 100));

  }, []);

  useEffect(() => {

    setCameraState(camera); // persisting updated value so the knot visibility monitor can access it

  }, [camera]);


  const setStartResolution = (id:string, zoom:number) => {
    let newObject = [];

    let found = false;

    for(const resolutionRange of startEndResolutionRef.current){

      if(resolutionRange.id == id){
        found = true;
        newObject.push({id: resolutionRange.id, start: zoom, end: resolutionRange.end});        
      }else{
        newObject.push({id: resolutionRange.id, start: resolutionRange.start, end: resolutionRange.end});        
      }

    }

    if(!found){
      newObject.push({id: id, start: zoom, end: null});        
    }

    setStartEndResolution(newObject);

  }

  const setEndResolution = (id:string, zoom:number) => {
    let newObject = []

    let found = false;

    for(const resolutionRange of startEndResolutionRef.current){

      if(resolutionRange.id == id){
        found = true;
        newObject.push({id: resolutionRange.id, start: resolutionRange.start, end: zoom});        
      }else{
        newObject.push({id: resolutionRange.id, start: resolutionRange.start, end: resolutionRange.end});        
      }

    }

    if(!found){
      newObject.push({id: id, start: null, end: zoom});        
    }

    setStartEndResolution(newObject);
  }

  return(
    <React.Fragment>
      {title != undefined ? <p>{title}</p> : <></>}
      {subtitle != undefined ? <p>{subtitle}</p> : <></>}
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
                <li key={item+"_list"}>
                  {item}
                  <Form.Control key={item+"_start"} type="number" onChange={(e) => {setStartResolution(item, parseFloat(e.target.value))}}/> 
                  <Form.Control key={item+"_end"} type="number" onChange={(e) => {setEndResolution(item, parseFloat(e.target.value))}}/> 
                </li>
              ))
          }
        </ul>
      </Row>
    </React.Fragment>
  )
}