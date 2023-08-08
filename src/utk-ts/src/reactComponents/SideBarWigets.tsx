import React, { useState } from "react";
import { ComponentIdentifier, WidgetType } from "../constants";
import { IComponentPosition, IGenericWidget, IView } from "../interfaces";
import { ToggleKnotsWidget } from './ToggleKnotsWidget';
import { SearchWidget } from './SearchWidget';
import {Row} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLayerGroup, faMagnifyingGlass, faChartSimple } from '@fortawesome/free-solid-svg-icons'
import * as d3 from "d3";
import { GenericScreenPlotContainer } from "./GenericScreenPlotContainer";

type SideBarWidgetsProps = {
    x: number,
    y: number,
    mapWidth: number,
    mapHeight: number,
    layersIds: any,
    knotVisibility: any,
    inputBarId: string,
    genericPlots: any,
    togglePlots: any,
    viewObjs: {type: ComponentIdentifier | WidgetType, obj: any, position: IComponentPosition, title: string | undefined, subtitle: string | undefined, grammarDefinition: IView | IGenericWidget | undefined}[] // each viewObj has a an object representing its logic
}

export const SideBarWidgets = ({x, y, mapWidth, mapHeight, layersIds, knotVisibility, inputBarId, genericPlots, togglePlots, viewObjs}:SideBarWidgetsProps) =>{

    const handleClickLayers = (e: any) => {

      if(d3.select("#toggle_knot_widget").style("display") == "block"){
          d3.select("#toggle_knot_widget").style("display", "none");
      }else{
        d3.select("#toggle_knot_widget").style("display", "block");
      }
    }

    const handleClickSearch = (e: any) => {

      if(d3.select("#search_widget").style("display") == "block"){
          d3.select("#search_widget").style("display", "none");
      }else{
        d3.select("#search_widget").style("display", "block");
      }
    }

    const handleTogglePlots = (e: any) => {
      togglePlots();
    }

    return (
        <React.Fragment>
          {genericPlots.length > 0 || viewObjs.length > 1 ? <div style={{backgroundColor: "white", width: "75px", position: "absolute", left: 0, top: 0, boxShadow: "3px 0px 5px 1px rgba(0,0,0,0.30)"}}>
            <Row>
              {
                viewObjs.map((component, index) => {
                  if(component.type == WidgetType.TOGGLE_KNOT){
                    return <FontAwesomeIcon key={"widget_"+index} size="3x" style={{padding: 0, marginTop: "10px"}} icon={faLayerGroup} onClick={handleClickLayers} />
                  }else if(component.type == WidgetType.SEARCH){
                    return <FontAwesomeIcon key={"widget_"+index} size="3x" style={{padding: 0, marginTop: "10px"}} icon={faMagnifyingGlass} onClick={handleClickSearch} />
                  }
                })
              }
              {genericPlots.length > 0 ? <FontAwesomeIcon size="3x" style={{padding: 0, marginTop: "10px"}} icon={faChartSimple} onClick={handleTogglePlots} /> : null}
            </Row>
          </div> : null}
            {
              viewObjs.map((component, index) => {
                if(component.type == WidgetType.TOGGLE_KNOT){
                  return <React.Fragment key={"toggle_knot_"+index}>
                    <div className='component' id="toggle_knot_widget" style={{position: "absolute", left: 110, top: 0, width: 300, height: 300, display: "none"}}>
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
                }else if(component.type == WidgetType.SEARCH){
                  return <React.Fragment key={"search_"+index}>
                    <div id="search_widget" style={{borderRadius: "8px 8px 8px 8px", position: "absolute", left: mapWidth - 250, top: 10, display: "none"}}>
                      <SearchWidget 
                        obj = {component.obj}
                        viewId = {"search_"+index}
                        inputId = {inputBarId}
                        title = {component.title}
                        subtitle = {component.subtitle}
                      />
                    </div>
                  </React.Fragment>
                }
              })
            }
        {
          genericPlots.map((item: any) => (
              <GenericScreenPlotContainer
                id={item.id}
                disp = {!item.hidden}
                svgId={item.svgId}
                x={mapHeight/2}
                y={mapWidth/2}
              />
          ))
        }
      </React.Fragment>
    );
}