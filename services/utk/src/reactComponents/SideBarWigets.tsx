import React, { useState } from "react";
import { ComponentIdentifier, WidgetType } from "../constants";
import { IComponentPosition, IView } from "../interfaces";

type SideBarWidgetsProps = {
    x: number,
    y: number,
    mapWidth: number,
    mapHeight: number,
    viewObjs: {type: ComponentIdentifier | WidgetType, obj: any, position: IComponentPosition, title: string | undefined, subtitle: string | undefined, grammarDefinition: IView}[] // each viewObj has a an object representing its logic
}

export const SideBarWidgets = ({
}:SideBarWidgetsProps) =>{

    return (
        <React.Fragment>
        <div style={{backgroundColor: "#EAEAEA", height: "100%", width: "100%"}}>
          {
            viewObjs.map((component, index) => {
              if(component.type == WidgetType.TOGGLE_KNOT){
                return <React.Fragment key={viewIds[index]}>
                  <div className='component' style={{position: "absolute", left: getTopLeft(component.position).left, top: getTopLeft(component.position).top, width: getSizes(component.position).width, height: getSizes(component.position).height}}>
                    <ToggleKnotsWidget
                      obj = {component.obj}
                      listLayers = {layersIds}
                      knotVisibility = {knotVisibility}
                      title = {component.title}
                      subtitle = {component.subtitle}
                      viewId = {viewIds[index]}
                      grammarDefinition = {component.grammarDefinition}
                    />
                  </div>
                </React.Fragment>
              }else if(component.type == WidgetType.SEARCH){
                return <Draggable nodeRef={nodeRef} key={viewIds[index]} defaultPosition={{x: getTopLeft(component.position).left+15, y: getTopLeft(component.position).top+15}}>
                  <div ref={nodeRef} className="drag-box" style={{borderRadius: "8px 8px 8px 8px"}}>
                    <SearchWidget 
                      obj = {component.obj}
                      viewId = {viewIds[index]}
                      inputId = {inputBarId}
                      title = {component.title}
                      subtitle = {component.subtitle}
                    />
                  </div>
                </Draggable>
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