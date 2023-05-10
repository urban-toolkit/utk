import React, { useState, useEffect, useRef } from "react";
import { Form } from "react-bootstrap";

// declaring the types of the props
type ToggleKnotsWidgetProps = {
    obj: any // map 
    knotVisibility: any
}

export const ToggleKnotsWidget = ({obj, knotVisibility}:ToggleKnotsWidgetProps) =>{
   
    return(
      <React.Fragment>
        <div className="d-flex align-items-center justify-content-center">
            <div style={{overflowY: "auto", padding: "5px"}}>
                {
                    Object.keys(knotVisibility).map((item) => (
                        <Form.Check checked={knotVisibility[item]} key={item} type="checkbox" label={item} id={'layer'+item} onChange={() => {obj.toggleKnot(item)}}/> 
                    
                    ))
                }
            </div>
        </div>
      </React.Fragment>
    )
}