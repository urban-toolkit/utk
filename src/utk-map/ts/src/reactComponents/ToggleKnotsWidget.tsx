import React, { useState, useEffect, useRef } from "react";
import { Form } from "react-bootstrap";
import Slider from '@mui/material/Slider';
import Box from "@mui/material/Box";

// declaring the types of the props
type ToggleKnotsWidgetProps = {
    obj: any // map 
    title: string | undefined
    subtitle: string | undefined
    listLayers: any
    knotVisibility: any
}

export const ToggleKnotsWidget = ({obj, title, subtitle, listLayers, knotVisibility}:ToggleKnotsWidgetProps) =>{
   
    // Animation ====================================================

    const [initialTime, setInitialTime] = useState<number>(Date.now());
    const [knotVisibilityMonitor, setKnotVisibilityMonitor] = useState<any>();

    const [fps, _setFps] = useState<number>(5);

    const fpsRef = useRef(fps);
    const setFps = (data: any) => {
        fpsRef.current = data;
        _setFps(data);
    };

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

    // =================================================

    const groupVisibility = (groupedList:any, visibilityList: any, id: string) => {
        for(const layer of groupedList[id]){
            if(visibilityList[layer]){
                return true;
            }
        }

        return false
    }

    // if activated uncheck all elements of the group. If not activated activate the first element
    const toggleGroup = (groupedList:any, visibilityList: any, id: string) => {
        let activated = false;

        for(const layer of groupedList[id]){ // deactivate all activated sub knots
            if(visibilityList[layer]){
                obj.toggleKnot(layer, false);
                activated = true;
            }
        }

        if(!activated){ // activate the first sub knot if no sub knot was activated
            obj.toggleKnot(groupedList[id][0], true);
        }
    }

    const getMarks = (layers: any) => {
        let marks = [];
        
        for(let i = 0; i < layers.length; i++){
            let layer = layers[i];

            marks.push({
                value: Math.round((i/layers.length)*100),
                label: 't'+i
            });
        }

        return marks;
    }

    const handleChangeSlides = (e: any, layer: string, marks: {value: number, label: string}[]) => {
        console.log(e,layer, marks);


    }

    return(
      <React.Fragment>
        {title != undefined ? <p>{title}</p> : <></>}
        {subtitle != undefined ? <p>{subtitle}</p> : <></>}
        <div className="d-flex align-items-center justify-content-center">
            <div style={{overflowY: "auto", padding: "5px"}}>
                {
                    Object.keys(listLayers).map((item) => (
                        <React.Fragment key={item+"_fragment"}>
                            <Form.Check key={item+"_check"} checked={groupVisibility(listLayers, knotVisibility, item)} type="checkbox" label={item} id={'layer'+item} onChange={() => {toggleGroup(listLayers, knotVisibility, item)}}/> 
                            {
                                listLayers[item].length > 1 ?
                                <Slider
                                    key={item+"_slider"}
                                    defaultValue={0}
                                    valueLabelDisplay="off"
                                    step={Math.round((1/listLayers[item].length)*100)}
                                    marks = {getMarks(listLayers[item])}
                                    onChange={(e) => {handleChangeSlides(e, item, getMarks(listLayers[item]))}}
                                /> : <></>
                            }
                        </React.Fragment>
                    ))
                }
            </div>
            
        </div>
      </React.Fragment>
    )
}