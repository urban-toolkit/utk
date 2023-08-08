import React, { useState } from "react";
// bootstrap component
import { Form } from "react-bootstrap";

import './VisWidget.css';

// VisWidget parameter types
type visWidProps = {
    genericScreenPlotToggle: React.Dispatch<React.SetStateAction<any>>,
    modifyLabelPlot: any, 
    listPlots: {id: number, hidden: boolean, svgId: string, label: string, checked: boolean, edit: boolean}[]
}

export const VisWidget = ({
    genericScreenPlotToggle,
    modifyLabelPlot,
    listPlots
}:visWidProps) =>{

    const handleGenericScreenPlotCheckBoxChange = (id: number) => {
        genericScreenPlotToggle(id);
    }

    const handleLabelEdit = (event: any, plotId: number) => {
        modifyLabelPlot(event.target.value, plotId);
    }

    return (
        <div style={{maxHeight: "60%", overflowY: "auto", padding: "5px"}}>
                {
                    listPlots.map((item) => (
                        <div key={"genericPlotsDiv"+item.id} className={"flex-div-genericPlots"}>
                            <Form.Check className={item.edit? "hidden-element" : ""} key={item.id} type="checkbox" label={item.label}  onChange={() => handleGenericScreenPlotCheckBoxChange(item.id)}/> 
                            <input style={{width: '60px', display: item.edit? 'block' : 'none'}} key={"labelInput"+item.id} type="text" value={item.label} onChange={(event) => handleLabelEdit(event,item.id)}/> 
                        </div>
                    ))
                }
        </div>
    );
}