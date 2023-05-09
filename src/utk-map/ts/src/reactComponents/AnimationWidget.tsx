import React, { useState, useEffect, useRef } from "react";
import { Form } from "react-bootstrap";

type AnimationWidgetProps = {
    listLayers: any
    obj: any // map 
    viewId: string
}

export const AnimationWidget = ({obj, listLayers, viewId}:AnimationWidgetProps) =>{

    const [initialTime, setInitialTime] = useState<number>(Date.now());
    const [knotVisibilityMonitor, setKnotVisibilityMonitor] = useState<any>();

    const [fps, _setFps] = useState<number>(5);

    const fpsRef = useRef(fps);
    const setFps = (data: any) => {
        fpsRef.current = data;
        _setFps(data);
    };

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

            if(knotsToConsider.length == 0) // should not do any animation
                return

            let elapsedTime = Date.now() - initialTime;

            let changeEvery = 1000/fpsRef.current;

            let indexLayer = Math.round((elapsedTime%(changeEvery*(knotsToConsider.length)))/changeEvery);
            if(indexLayer > knotsToConsider.length-1){
                indexLayer = 0;
            }
            let layerToShow = knotsToConsider[indexLayer];

            for(let i = 0; i < allKnots.length; i++){
                let key = allKnots[i];

                if(key == layerToShow){
                    obj.toggleKnot(layerToShow, true);
                }else{
                    obj.toggleKnot(key, false);
                }
            }
                
        }, 50));

    }, []);

    return(
      <React.Fragment>
        <div className="d-flex align-items-center justify-content-center">
            <p>Animation</p>
            <div id={"animation_widget_"+viewId} style={{overflowY: "auto", padding: "5px"}}>
                {
                    Object.keys(listLayers).map((item: any) => (
                        <Form.Check key={item} type="checkbox" label={item} id={item} onChange={() => {toggleKnotChecked(item, listLayers);}}/> 
                    ))
                }
                <Form.Group>
                    <Form.Label>FPS</Form.Label>
                    <Form.Control type="number" onChange={(e) => {if(e.target.value != ''){setFps(parseInt(e.target.value))}}}/>
                </Form.Group>
            </div>
        </div>
      </React.Fragment>
    )
}