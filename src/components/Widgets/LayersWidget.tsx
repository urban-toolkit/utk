import React, { useState } from "react";
// bootstrap component
import { Form } from "react-bootstrap";

// VisWidget parameter types
type layersWidProps = {
    listLayers: string[],
    layerToggle: React.Dispatch<React.SetStateAction<any>>
}

export const LayersWidget = ({
    listLayers,
    layerToggle
}:layersWidProps) =>{

    const [layersChecked, setLayersChecked] = useState<any>({});

    const toggleLayerChecked = (id:string) => {
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

    return (
        <div style={{maxHeight: "60%", overflowY: "auto", padding: "5px"}}>
                {
                    listLayers.map((item) => (
                        // layersChecked[item] can also be undefined
                        <Form.Check checked={layersChecked[item] == true || layersChecked[item] == undefined ? true : false} key={item} type="checkbox" label={item} id={'layer'+item} onChange={() => {toggleLayerChecked(item);layerToggle(item)}}/> 
                    ))
                }
        </div>
    );
}