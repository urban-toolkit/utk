import React, { useState, useEffect, useRef } from "react";
import { Form } from "react-bootstrap";

// declaring the types of the props
type ToggleKnotsWidgetProps = {
    listLayers: string[]
    obj: any // map 
}

export const ToggleKnotsWidget = ({listLayers, obj}:ToggleKnotsWidgetProps) =>{
   
    const [layersChecked, setLayersChecked] = useState<any>({});

    const toggleKnotChecked = (id:string) => {
        let newObject:any = {};
        
        let layersCheckedKeys = Object.keys(layersChecked);

        for(const key of layersCheckedKeys){
            if(key != id){
                newObject[key] = layersChecked[key];  
            }else{
                newObject[key] = !layersChecked[key]; 
            }
        }

        if(newObject[id] == undefined){
            newObject[id] = false;
        }
        
        setLayersChecked(newObject);
    }   

    return(
      <React.Fragment>
        <div className="d-flex align-items-center justify-content-center">
            <div style={{overflowY: "auto", padding: "5px"}}>
                {
                    listLayers.map((item) => (
                        // layersChecked[item] can also be undefined
                        <Form.Check checked={layersChecked[item] == true || layersChecked[item] == undefined ? true : false} key={item} type="checkbox" label={item} id={'layer'+item} onChange={() => {toggleKnotChecked(item);obj.toggleKnot(item)}}/> 
                    ))
                }
            </div>
        </div>
      </React.Fragment>
    )
}