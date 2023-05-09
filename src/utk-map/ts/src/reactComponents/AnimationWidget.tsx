import React, { useState, useEffect, useRef } from "react";
import { Form } from "react-bootstrap";

type AnimationWidgetProps = {
    listLayers: any
    fps: number
    obj: any // map 
    viewId: string
}

export const AnimationWidget = ({obj, listLayers, fps, viewId}:AnimationWidgetProps) =>{

    const [initialTime, setInitialTime] = useState<number>(Date.now());
    const [knotVisibilityMonitor, setKnotVisibilityMonitor] = useState<any>();

    const toggleKnotChecked = (id:string, values: any) => {
        let newObject:any = {};
        
        let layersCheckedKeys = Object.keys(values);

        for(const key of layersCheckedKeys){
            if(key != id){
                newObject[key] = values[key];  
            }else{
                newObject[key] = !values[key]; 
            }
        }

    }   

    useEffect(() => {

        if(knotVisibilityMonitor != undefined){
            clearInterval(knotVisibilityMonitor);
        }
        
        setKnotVisibilityMonitor(window.setInterval(function(){

            let div = document.getElementById("animation_widget_"+viewId);

            if(div == null)
                return;

            let children = div.childNodes;

            console.log("children", children);

            for (let i = 0; i < children.length; i++) {
                const child = children[i] as HTMLElement;
            
                let input = child.querySelectorAll("div input")[0] as HTMLInputElement;
            }

            // let layersCheckedKeys = Object.keys(listLayers);

            // if(layersCheckedKeys.length == 0){
            //     layersCheckedKeys = Object.keys(listLayers);
            // }

            // // console.log("layersCheckedKeys (interval)", layersCheckedKeys);

            // let layersToConsider = [];

            // for(let i = 0; i < layersCheckedKeys.length; i++){
            //     let key = layersCheckedKeys[i];

            //     if(Object.keys(layersChecked).length == 0){
            //         if(listLayers[key]){
            //             layersToConsider.push(key);
            //         }
            //     }else{
            //         if(layersChecked[key]){
            //             layersToConsider.push(key);
            //         }
            //     }

            // }

            // let elapsedTime = Date.now() - initialTime;
            // let changeEvery = 1000/fps;

            // let layerToShow = layersToConsider[Math.round((elapsedTime%(changeEvery*(layersToConsider.length-1)))/changeEvery)];

            // for(let i = 0; i < layersCheckedKeys.length; i++){
            //     let key = layersCheckedKeys[i];

            //     if(key == layerToShow){
            //         obj.toggleKnot(layerToShow, true);

            //     }else{
            //         obj.toggleKnot(key, false);
            //     }
            // }
                
        }, 100));

    }, []);

    return(
      <React.Fragment>
        <div className="d-flex align-items-center justify-content-center">
            <p>Animation</p>
            <div id={"animation_widget_"+viewId} style={{overflowY: "auto", padding: "5px"}}>
                {
                    Object.keys(listLayers).map((item: any) => (
                        // layersChecked[item] can also be undefined
                        <Form.Check key={item} type="checkbox" label={item} id={'widget_'+viewId+'_layer_'+item} onChange={() => {toggleKnotChecked(item, listLayers);}}/> 
                    ))
                }
            </div>
        </div>
      </React.Fragment>
    )
}