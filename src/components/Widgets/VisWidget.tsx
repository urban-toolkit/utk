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
    // <Row style={{padding: 0, margin: 0}}>
        <div style={{marginLeft: "auto", marginRight: "auto", width: "200px", marginTop: "10px", textAlign: "center", marginBottom: "10px"}}>
            {
                /* button for vis, clicking on it will open the list of visualizations supported */
            }
            <Button id="space" style={{margin: 0}} variant="outline-secondary" onClick={() => setVisOpen(!visOpen)} aria-controls="example-collapse-text" aria-expanded={visOpen}>
                <FaChartBar /> Plots
            </Button>
            {/* <Button id="space" variant="outline-secondary" onClick={togglePlotCollection}>
                <FaChartBar /> Plot Collection
            </Button> */}
            {
            /* list of visualizations */
            }
            <Collapse in={visOpen} dimension="width">
                <div>
                    {
                        listPlots.map((item) => (
                            <div key={"genericPlotsDiv"+item.id} className={"flex-div-genericPlots"}>
                                <Form.Check className={item.edit? "hidden-element" : ""} key={item.id} type="checkbox" label={item.label}  onChange={() => handleGenericScreenPlotCheckBoxChange(item.id)}/> 
                                <input style={{width: '60px', display: item.edit? 'block' : 'none'}} key={"labelInput"+item.id} type="text" value={item.label} onChange={(event) => handleLabelEdit(event,item.id)}/> 
                                <Button key={"genericPlotEdit"+item.id} style={{paddingTop: 0}} onClick={() => toggleEditing(item.id)} variant="link"><FaEdit /></Button>
                                {/* <Button key={"genericPlotRemove"+item.id} onClick={() => removeGenericPlotCheck(item.id)} variant="link"><FaRegTrashAlt /></Button> */}
                            </div>
                        ))
                    }
                </div>
            </Collapse>
        </div>
    );
}