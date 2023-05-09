import React, { useState, useEffect, useRef } from "react";
import { Form } from "react-bootstrap";

import './ResolutionWidget.css';

type ResolutionWidgetProps = {
    listLayers: string[]
    obj: any // map 
    viewId: string
    camera: {position: number[], direction: {right: number[], lookAt: number[], up: number[]}}
}

export const ResolutionWidget = ({obj, listLayers, viewId, camera}:ResolutionWidgetProps) =>{

    return(
      <React.Fragment>
        <div className="d-flex align-items-center justify-content-center">
            <p>Resolution</p>
        </div>
      </React.Fragment>
    )
}