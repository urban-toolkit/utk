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

            let knotsToConsider = [];
            let allKnots = [];

            for (let i = 0; i < children.length; i++) {
                const child = children[i] as HTMLElement;
            
                let input = child.querySelectorAll("div input")[0] as HTMLInputElement;
            
                if(input.checked){
                    knotsToConsider.push(input.id);
                }

                allKnots.push(input.id);

            }

            let elapsedTime = Date.now() - initialTime;
            let changeEvery = 1000/fps;

            let layerToShow = '0';

            if(knotsToConsider.length-1 > 0){
                layerToShow = knotsToConsider[Math.round((elapsedTime%(changeEvery*(knotsToConsider.length-1)))/changeEvery)];
            }else{ // there is only one knot selected
                layerToShow = knotsToConsider[0];
            }

            for(let i = 0; i < allKnots.length; i++){
                let key = allKnots[i];

                if(key == layerToShow){
                    obj.toggleKnot(layerToShow, true);
                }else{
                    obj.toggleKnot(key, false);
                }
            }
                
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
                        <Form.Check key={item} type="checkbox" label={item} id={item} onChange={() => {toggleKnotChecked(item, listLayers);}}/> 
                    ))
                }
            </div>
        </div>
      </React.Fragment>
    )
}