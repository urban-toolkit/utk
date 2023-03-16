import React, { useState } from "react";
// bootstrap component
import { Row, Col, Button, Collapse, Form } from "react-bootstrap";
// icon
import { FaChartBar, FaEdit, FaRegTrashAlt } from "react-icons/fa";

import './VisWidget.css';

// VisWidget parameter types
type visWidProps = {
    genericScreenPlotToggle: React.Dispatch<React.SetStateAction<any>>,
    addGenericPlot: any,
    togglePlotCollection: React.Dispatch<React.SetStateAction<any>>,
    modifyLabelPlot: any, 
    modifyEditingState: React.Dispatch<React.SetStateAction<any>>,
    listPlots: {id: number, hidden: boolean, svgId: string, label: string, checked: boolean, edit: boolean}[],
    removeGenericPlot: React.Dispatch<React.SetStateAction<any>>,
}

/** 
 * Component creates the VIS menu and handles
 * view or hiding the visualization
*/

export const VisWidget = ({
    genericScreenPlotToggle,
    addGenericPlot,
    togglePlotCollection,
    modifyLabelPlot,
    modifyEditingState,
    listPlots,
    removeGenericPlot
}:visWidProps) =>{
    // state controlling the collapse
    const [visOpen, setVisOpen] = useState(false)

    /**
     * state variables controlling the checkbox toggles
     * if checked will show the visualization
     * if not hide the visualization
     */

    const handleGenericScreenPlotCheckBoxChange = (id: number) => {
        genericScreenPlotToggle(id);
    }

    const addSurfacePlotComponent = () => {
        addGenericPlot();
    }

    const handleLabelEdit = (event: any, plotId: number) => {
        modifyLabelPlot(event.target.value, plotId);
    }

    const toggleEditing = (plotId: number) => {
        modifyEditingState(plotId);
    }

    const removeGenericPlotCheck = (plotId: number) => {
        removeGenericPlot(plotId);
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