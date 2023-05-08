import React, { useState, useEffect, useRef } from "react";
import { Form } from "react-bootstrap";

type AnimationWidgetProps = {
    listLayers: any
    fps: number
    obj: any // map 
}

export const AnimationWidget = ({obj, listLayers, fps}:AnimationWidgetProps) =>{

    const [layersChecked, setLayersChecked] = useState<any>(listLayers);

    const [initialTime, setInitialTime] = useState<number>(Date.now());
    const [knotVisibilityMonitor, setKnotVisibilityMonitor] = useState<any>();

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

    useEffect(() => {

        if(Object.keys(listLayers).length > 0){
            if(knotVisibilityMonitor != undefined){
                clearInterval(knotVisibilityMonitor);
            }

            setKnotVisibilityMonitor(window.setInterval(function(){

                let layersCheckedKeys = Object.keys(layersChecked);

                if(layersCheckedKeys.length == 0){
                    layersCheckedKeys = Object.keys(listLayers);
                }

                let layersToConsider = [];

                for(let i = 0; i < layersCheckedKeys.length; i++){
                    let key = layersCheckedKeys[i];

                    layersToConsider.push(key);
                }

                let elapsedTime = Date.now() - initialTime;
                let changeEvery = 1000/fps;

                let layerToShow = layersToConsider[Math.round((elapsedTime%(changeEvery*layersToConsider.length))/changeEvery)];

                console.log("layerToShow", Math.round((elapsedTime%(changeEvery*layersToConsider.length))/changeEvery));

                for(let i = 0; i < layersCheckedKeys.length; i++){
                    let key = layersCheckedKeys[i];

                    if(key == layerToShow){
                        obj.toggleKnot(layerToShow, true);

                    }else{
                        obj.toggleKnot(key, false);
                    }
                }
                
            }, 100));
        }

    }, [listLayers]);

    return(
      <React.Fragment>
        <div className="d-flex align-items-center justify-content-center">
            <p>Animation</p>
            <div style={{overflowY: "auto", padding: "5px"}}>
                {
                    Object.keys(listLayers).map((item: any) => (
                        // layersChecked[item] can also be undefined
                        <Form.Check checked={layersChecked[item] == true || layersChecked[item] == undefined ? true : false} key={item} type="checkbox" label={item} id={'layer'+item} onChange={() => {toggleKnotChecked(item);}}/> 
                    ))
                }
            </div>
        </div>
      </React.Fragment>
    )
}