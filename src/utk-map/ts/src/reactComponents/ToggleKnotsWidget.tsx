import React, { useState, useEffect, useRef } from "react";
import { Form } from "react-bootstrap";
import Slider from '@mui/material/Slider';
import {Row, Col} from 'react-bootstrap';

// declaring the types of the props
type ToggleKnotsWidgetProps = {
    obj: any // map 
    title: string | undefined
    subtitle: string | undefined
    listLayers: any
    knotVisibility: any
    viewId: string
}

export const ToggleKnotsWidget = ({obj, title, subtitle, listLayers, knotVisibility, viewId}:ToggleKnotsWidgetProps) =>{
   
    // Animation ====================================================

    const [initialTime, setInitialTime] = useState<number>(Date.now());
    const [knotVisibilityMonitor, setKnotVisibilityMonitor] = useState<any>();

    const [fps, _setFps] = useState<number>(5);

    const fpsRef = useRef(fps);
    const setFps = (data: any) => {
        fpsRef.current = data;
        _setFps(data);
    };

    // current ranges
    const [range, _setRange] = useState<any>({});

    const rangeRef = useRef(range);
    const setRange = (data: any) => {
        rangeRef.current = data;
        _setRange(data);
    };

    // persisting listLayers to get inside interval
    const [listLayersState, _setListLayersState] = useState<any>({});

    const listLayersStateRef = useRef(listLayersState);
    const setListLayersState = (data: any) => {
        listLayersStateRef.current = data;
        _setListLayersState(data);
    };
    

    useEffect(() => {

        if(knotVisibilityMonitor != undefined){
            clearInterval(knotVisibilityMonitor);
        }
        
        setKnotVisibilityMonitor(window.setInterval(function(){

            let div = document.getElementById("toggle_widget_"+viewId);

            if(div == null || Object.keys(listLayersStateRef.current).length == 0)
                return;

            let children = div.childNodes;

            let groupsToAnimate = [];

            for (let i = 0; i < children.length; i++) {
                const child = children[i] as HTMLElement;
            
                let input = child.querySelectorAll("div input")[0] as HTMLInputElement;
            
                if(input.checked && listLayersStateRef.current[input.id].length > 1){
                    groupsToAnimate.push(input.id);
                }
            }

            for(const group of groupsToAnimate){

                let knotsToConsider = [];
                let range = 0 ? rangeRef.current[group] == undefined : rangeRef.current[group];

                knotsToConsider = listLayersStateRef.current[group].slice(0,range+1);

                if(knotsToConsider.length == 0) // should not do any animation
                    return
    
                let elapsedTime = Date.now() - initialTime;
    
                let changeEvery = 1000/fpsRef.current;
    
                let indexLayer = Math.round((elapsedTime%(changeEvery*(knotsToConsider.length)))/changeEvery);

                if(indexLayer > knotsToConsider.length-1){
                    indexLayer = 0;
                }

                let layerToShow = knotsToConsider[indexLayer];
    
                for(let i = 0; i < listLayersStateRef.current[group].length; i++){
                    let key = listLayersStateRef.current[group][i];
    
                    if(key == layerToShow){
                        obj.toggleKnot(layerToShow, true);
                    }else{
                        obj.toggleKnot(key, false);
                    }
                }
            }
                
        }, 50));

    }, []);

    useEffect(() => {

        setListLayersState(listLayers);

    }, [listLayers]);

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
    const toggleGroup = (groupedList:any, visibilityList: any, id: string, value: boolean | null = null) => {
        if(value == null){
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
        }else{
            for(let i = 0; i < groupedList[id].length; i++){
                let layer = groupedList[id][i]
                if(value){
                    if(i == 0)
                        obj.toggleKnot(layer, true);
                    else
                        obj.toggleKnot(layer, false);
                }else{
                    obj.toggleKnot(layer, false);
                }
            }
        }
    }

    const getMarks = (layers: any) => {
        let marks = [];
        
        for(let i = 0; i < layers.length; i++){

            let mark = {
                value: Math.round((i/layers.length)*100),
                label: ''+i
            };

            marks.push(mark);
        }

        return marks;
    }

    const handleChangeSlides = (e: any, group: string, step: number) => {

        let newObj: any = {};

        let exists = false;

        for(const key of Object.keys(rangeRef.current)){
            if(key != group){
                newObj[key] = rangeRef.current[key];
            }else{
                exists = true;
                newObj[key] = Math.round(e.target.value/step);
            }
        }

        if(!exists){
            newObj[group] = Math.round(e.target.value/step);
        }
        
        setRange(newObj);
    }

    return(
      <React.Fragment>
        {title != undefined ? <div style={{margin: "4px", height: "11%", display: "flex", alignItems: "center"}}><p style={{fontWeight: "bold", fontSize: "20px"}}>{title}</p></div> : <></>}
        {subtitle != undefined ? <div style={{marginBottom: "4px", height: "5%"}}><p style={{color: "#bfbec2", fontSize: "16px", fontWeight: "bold"}}>{subtitle}</p></div> : <></>}
        {/* <div className="d-flex align-items-center justify-content-center"> */}
        <div style={{overflowY: "auto", overflowX: "clip", height: "73%", padding: "10px"}} id={"toggle_widget_"+viewId}>
            {
                Object.keys(listLayers).map((item, index) => (
                    <React.Fragment key={item+"_fragment"}>
                        <Row style={{paddingTop: "10px", paddingBottom: "10px", borderBottom: '1px solid #e2e1e6'}} className="align-items-center">
                            <Col>
                                <Form.Check key={item+"_check"} checked={groupVisibility(listLayers, knotVisibility, item)} type="checkbox" label={item} id={item} onChange={() => {toggleGroup(listLayers, knotVisibility, item)}}/> 
                            </Col>
                            {
                                listLayers[item].length > 1 ?
                                <Col>
                                    <Row style={{padding: 0}} className="align-items-center">
                                        <Col md={9}>
                                            <Slider
                                                key={item+"_slider"}
                                                defaultValue={0}
                                                valueLabelDisplay="off"
                                                step={Math.round((1/listLayers[item].length)*100)}
                                                marks = {getMarks(listLayers[item])}
                                                onChange={(e) => {handleChangeSlides(e, item, Math.round((1/listLayers[item].length)*100))}}
                                                disabled = {!groupVisibility(listLayers, knotVisibility, item)}
                                            />
                                        </Col>
                                        <Col md={3} style={{paddingLeft: 0}}>
                                            <Form.Control placeholder="FPS" type="text" onChange={(e) => {if(e.target.value != ''){setFps(parseInt(e.target.value))}}}/>
                                        </Col>
                                </Row></Col> : <></>
                            }
                        </Row>
                    </React.Fragment>
                ))
            }
        </div>
            
      </React.Fragment>
    )
}