import React, { useState } from "react";
import { ComponentIdentifier, WidgetType } from "../constants";
import { IComponentPosition, IGenericWidget, IView } from "../interfaces";
import { ToggleKnotsWidget } from './ToggleKnotsWidget';
import { SearchWidget } from './SearchWidget';

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

    return (
        <React.Fragment>
        <div style={{backgroundColor: "#EAEAEA", height: "100%", width: "100%"}}>
          {
            viewObjs.map((component, index) => {
              if(component.type == WidgetType.TOGGLE_KNOT){
                return <React.Fragment key={"toggle_knot_"+index}>
                  <div className='component' style={{position: "absolute", left: 0, top: 0, width: 200, height: 200}}>
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
                  <div style={{borderRadius: "8px 8px 8px 8px"}} style={{position: "absolute", left: x, top: y}}>
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