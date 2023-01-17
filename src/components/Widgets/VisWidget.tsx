import { useState } from "react";
// bootstrap component
import { Row, Col, Button, Collapse, Form } from "react-bootstrap";
// icon
import { FaChartBar, FaEdit, FaRegTrashAlt } from "react-icons/fa";

import './VisWidget.css';

// VisWidget parameter types
type visWidProps = {
    genericScreenPlotToggle: React.Dispatch<React.SetStateAction<any>>,
    addGenericPlot: React.Dispatch<React.SetStateAction<any>>,
    togglePlotCollection: React.Dispatch<React.SetStateAction<any>>,
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
    removeGenericPlot
}:visWidProps) =>{
    // state controlling the collapse
    const [visOpen, setVisOpen] = useState(false)
    const [currentPlotId, setCurrentPlotId] = useState(1)

    /**
     * state variables controlling the checkbox toggles
     * if checked will show the visualization
     * if not hide the visualization
     */

    // const [genericScreenPlotCheckBox, setGenericScreenPlotCheckBox] = useState(false);

    const handleGenericScreenPlotCheckBoxChange = (id: number) => {
        // setGenericScreenPlotCheckBox(!genericScreenPlotCheckBox)
        // genericScreenPlotToggle(!genericScreenPlotCheckBox)        
        genericScreenPlotToggle(id);
    }

    const [listGenericPlots, setListGenericPlots] = useState([{id: 0, label: "Generic Plot", checked: false, edit: false}])

    const addSurfacePlotComponent = () => {
        setListGenericPlots(listGenericPlots.concat([{id: currentPlotId, label: "Generic Plot", checked: false, edit: false}]))
        addGenericPlot(currentPlotId);
        setCurrentPlotId(currentPlotId+1);
    }

    const handleLabelEdit = (event: any, plotId: number) => {
        let modifiedPlots = [];
        
        for(const plot of listGenericPlots){
            if(plot.id == plotId){
                modifiedPlots.push({id: plot.id, label: event.target.value, checked: plot.checked, edit: plot.edit});
            }else{
                modifiedPlots.push({id: plot.id, label: plot.label, checked: plot.checked, edit: plot.edit});
            }
        }
    
        setListGenericPlots(modifiedPlots);
    }

    const toggleEditing = (plotId: number) => {
        let modifiedPlots = [];
        
        for(const plot of listGenericPlots){
            if(plot.id == plotId){
                modifiedPlots.push({id: plot.id, label: plot.label, checked: plot.checked, edit: !plot.edit});
            }else{
                modifiedPlots.push({id: plot.id, label: plot.label, checked: plot.checked, edit: plot.edit});
            }
        }
    
        setListGenericPlots(modifiedPlots);
    }

    const removeGenericPlotCheck = (plotId: number) => {
        let modifiedPlots = [];
        
        for(const plot of listGenericPlots){
            if(plot.id != plotId){
                modifiedPlots.push({id: plot.id, label: plot.label, checked: plot.checked, edit: plot.edit});
            }
        }
    
        setListGenericPlots(modifiedPlots);
        removeGenericPlot(plotId);
    }

    return (<Row>
            <Col>
                {
                /* button for vis, clicking on it will open the list of visualizations supported */
                }
                <Button id="space" variant="outline-secondary" onClick={() => setVisOpen(!visOpen)} aria-controls="example-collapse-text" aria-expanded={visOpen}>
                    <FaChartBar /> VIS
                </Button>
                <Button id="space" variant="outline-secondary" onClick={togglePlotCollection}>
                    <FaChartBar /> Plot Collection
                </Button>
                {
                /* list of visualizations */
                }
                <Collapse in={visOpen}>
                    <Form>
                        <Form.Group className="mb-3" controlId="formBarVisCheckbox" id="space">
                            {
                                listGenericPlots.map((item) => (
                                    <div key={"genericPlotsDiv"+item.id} className={"flex-div-genericPlots"}>
                                        <Form.Check className={item.edit? "hidden-element" : ""} key={item.id} type="checkbox" label={item.label}  onChange={() => handleGenericScreenPlotCheckBoxChange(item.id)}/> 
                                        <input style={{width: '100px', display: item.edit? 'block' : 'none'}} key={"labelInput"+item.id} type="text" value={item.label} onChange={(event) => handleLabelEdit(event,item.id)}/> 
                                        <Button key={"genericPlotEdit"+item.id} onClick={() => toggleEditing(item.id)} variant="link"><FaEdit /></Button>
                                        <Button key={"genericPlotRemove"+item.id} onClick={() => removeGenericPlotCheck(item.id)} variant="link"><FaRegTrashAlt /></Button>
                                    </div>
                                ))
                            }
                        </Form.Group>
                        <Button id="newSurfacePlot" variant="outline-secondary" onClick={addSurfacePlotComponent}>
                            New Plot
                        </Button>       
                    </Form>
                </Collapse>
            </Col>
        </Row>);
}