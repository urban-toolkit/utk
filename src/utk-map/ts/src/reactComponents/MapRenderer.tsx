import React, { useState, useEffect, useRef } from "react";
import {Col, Row, Button} from 'react-bootstrap'
import { VisWidget } from "./VisWidget";
import { LayersWidget } from "./LayersWidget";

// declaring the types of the props
type MapRendererProps = {
    divWidth: number,
    systemMessages: {text: string, color: string}[],
    applyGrammarButtonId: string,
    genericScreenPlotToggle: React.Dispatch<React.SetStateAction<any>> | null,
    modifyLabelPlot: any,
    listPlots: {id: number, hidden: boolean, svgId: string, label: string, checked: boolean, edit: boolean}[],
    listLayers: string[],
    listLayersCallback: any,
    linkMapAndGrammarId: string,
    frontEndMode?: string, //web is the default
    data?: any,
    linkedContainerGenerator?: any,
    cameraUpdateCallback?: any,
    filterKnotsUpdateCallback?: any,
    inputId?: string
}

class MapConfig {
    public static frontEndMode: string | undefined;
    public static linkedContainerGenerator: any;
    public static cameraUpdateCallback: any;
    public static filterKnotsUpdateCallback: any;
    public static listLayersCallback: any;
}

export const MapRendererContainer = ({divWidth, systemMessages, applyGrammarButtonId, genericScreenPlotToggle, modifyLabelPlot, listPlots, listLayers, listLayersCallback, linkMapAndGrammarId, frontEndMode, data, linkedContainerGenerator, cameraUpdateCallback, filterKnotsUpdateCallback, inputId}:MapRendererProps) =>{

    MapConfig.frontEndMode = frontEndMode;
    MapConfig.linkedContainerGenerator = linkedContainerGenerator;
    MapConfig.cameraUpdateCallback = cameraUpdateCallback;
    MapConfig.filterKnotsUpdateCallback = filterKnotsUpdateCallback;
    MapConfig.listLayersCallback = listLayersCallback;
  
    return(
      <React.Fragment>
        
        <Row style={{padding: 0, margin: 0}}>
          <div style={{padding: 0}}>
            <div id='map'>
            </div>
            <div id='svg_div'>
              <svg id='svg_element' xmlns="http://www.w3.org/2000/svg" style={{"display": "none"}}>
              </svg>
            </div>
          </div>
  
          <div style={{position: "absolute", height: "160px", bottom: 0, width: (divWidth/12)*window.innerWidth, backgroundColor: "rgba(200,200,200,0.3)", padding: 0}}>
            
            <Row md={12} style={{padding: 0, margin: 0}}>
  
              <Col md={4} style={{padding: 0, margin: "auto", height: "160px"}}>
                <div className="d-flex align-items-center justify-content-center" style={{height: "160px"}}>
                  <Button variant="secondary" id={applyGrammarButtonId} style={{marginRight: "10px"}}>Apply Grammar</Button>
                  <input name="linkMapAndGrammar" type="checkbox" id={linkMapAndGrammarId} style={{marginRight: "5px"}}></input>
                  <label htmlFor="linkMapAndGrammar">Link</label>
                </div>
              </Col>
  
              <Col md={4} style={{padding: 0, margin: 0, height: "160px"}}>
                  {
                    systemMessages.map((item, index) => (
                        <p style={{color: item.color, width: ((divWidth/12)*window.innerWidth)/3, textAlign: "center", fontWeight: "bold", marginTop: "18px", marginBottom: "5px", position: "absolute"}} key={index}>{item.text}</p>
                    ))
                  } 
                <div className="d-flex flex-column align-items-center justify-content-center" style={{height: "160px"}}>
                  <input type="text" id={inputId} name="searchBar" placeholder='Search place' style={{width: "100%"}}></input>
                </div>
              </Col>
  
              <Col md={4} style={{padding: 0, margin: 0, height: "160px"}}>
                <Row style={{padding: 0, margin: 0}}>
                  <Col md={6} style={{padding: 0, margin: 0}}>
                    <div className="d-flex align-items-center justify-content-center" style={{height: "160px"}}>
                      {/* <VisWidget 
                          genericScreenPlotToggle = {genericScreenPlotToggle}
                          listPlots = {listPlots}
                          modifyLabelPlot = {modifyLabelPlot}
                        /> */}
                    </div>
                  </Col>
                  
                  <Col md={6} style={{padding: 0, margin: 0}}> 
                    <div className="d-flex align-items-center justify-content-center" style={{height: "160px"}}>
                      <LayersWidget 
                        listLayers = {listLayers}
                        knotToggle = {(id: string) => console.log(id)}                      
                      />
                    </div>
                  </Col>
                </Row>
              </Col>
  
            </Row>
  
          </div>
  
        </Row>
          
  
      </React.Fragment>
    )
}

// knotToggle = {(id: string) => app.map.toggleKnot(id)}                      