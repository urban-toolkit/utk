import React, { useState } from "react";
import { ComponentIdentifier, WidgetType } from "../constants";
import { IComponentPosition, IGenericWidget, IView } from "../interfaces";
import { ToggleKnotsWidget } from './ToggleKnotsWidget';
import { SearchWidget } from './SearchWidget';
import {Row} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLayerGroup } from '@fortawesome/free-solid-svg-icons'
import * as d3 from "d3";

type SideBarWidgetsProps = {
    x: number,
    y: number,
    mapWidth: number,
    mapHeight: number,
    layersIds: any,
    knotVisibility: any,
    inputBarId: string,
    viewObjs: {type: ComponentIdentifier | WidgetType, obj: any, position: IComponentPosition, title: string | undefined, subtitle: string | undefined, grammarDefinition: IView | IGenericWidget | undefined}[] // each viewObj has a an object representing its logic
}

export const SideBarWidgets = ({x, y, mapWidth, mapHeight, layersIds, knotVisibility, inputBarId, viewObjs}:SideBarWidgetsProps) =>{

    const handleClickLayers = (e: any) => {
      console.log("clicked");

      if(d3.select("#toggle_knot_widget").style("display") == "block"){
          d3.select("#toggle_knot_widget").style("display", "none");
      }else{
        d3.select("#toggle_knot_widget").style("display", "block");
      }


    }

    return (
        <React.Fragment>
        <div style={{backgroundColor: "white", height: "100%", width: "100px", position: "absolute", left: 0, top: 0}}>
          <Row>
            <FontAwesomeIcon icon={faLayerGroup} onClick={handleClickLayers} />
          </Row>

          {
            viewObjs.map((component, index) => {
              if(component.type == WidgetType.TOGGLE_KNOT){
                return <React.Fragment key={"toggle_knot_"+index}>
                  <div className='component' id="toggle_knot_widget" style={{position: "absolute", left: 110, top: 0, width: 200, height: 200, display: "none"}}>
                    <ToggleKnotsWidget
                      obj = {component.obj}
                      listLayers = {layersIds}
                      knotVisibility = {knotVisibility}
                      title = {component.title}
                      subtitle = {component.subtitle}
                      viewId = {"toggle_knot_"+index}
                      grammarDefinition = {component.grammarDefinition}
                    />
                  </div>
                </React.Fragment>
              }
              
              // else if(component.type == WidgetType.SEARCH){
              //   return <React.Fragment key={"search_"+index}>
              //     <div style={{borderRadius: "8px 8px 8px 8px"}} style={{position: "absolute", left: x, top: y}}>
              //       <SearchWidget 
              //         obj = {component.obj}
              //         viewId = {"search_"+index}
              //         inputId = {inputBarId}
              //         title = {component.title}
              //         subtitle = {component.subtitle}
              //       />
              //     </div>
              //   </React.Fragment>
              // }
            })
          }
        </div>
          {/* {
          genericPlots.map((item) => (
              <GenericScreenPlotContainer
                key={item.id}
                disp = {!item.hidden}
                svgId={item.svgId}
              />
          ))
          } */}
      </React.Fragment>
    );
}