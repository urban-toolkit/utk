import { useState } from "react";
// bootstrap component
import { Row, Col, Button, Collapse, Form } from "react-bootstrap";
// icon
import { FaChartBar } from "react-icons/fa";


// VisWidget parameter types
type visWidProps = {
    barChartToggle: React.Dispatch<React.SetStateAction<any>>,
    scatterToggle: React.Dispatch<React.SetStateAction<any>>,
    heatmapToggle: React.Dispatch<React.SetStateAction<any>>
}

/** 
 * Component creates the VIS menu and handles
 * view or hiding the visualization
*/

export const VisWidget = ({
    barChartToggle,
    scatterToggle,
    heatmapToggle
}:visWidProps) =>{
    // state controlling the collapse
    const [visOpen, setVisOpen] = useState(false)

    /**
     * state variables controlling the checkbox toggles
     * if checked will show the visualization
     * if not hide the visualization
     */

    const [barCheckBox, setBarCheckBox] = useState(false);

    const handleBarCheckBoxChange = () => {
        setBarCheckBox(!barCheckBox)
        barChartToggle(!barCheckBox)        

    }

    const [scatterCheckBox, setScatterCheckBox] = useState(false);

    const handleScatterCheckBoxChange = () => {
        setScatterCheckBox(!scatterCheckBox)
        scatterToggle(!scatterCheckBox)        

    }

    const [heatmapCheckBox, setHeatmapCheckBox] = useState(false);

    const handleHeatmapCheckBox = () => {
        setHeatmapCheckBox(!heatmapCheckBox)
        heatmapToggle(!heatmapCheckBox)        

    }


    return (<Row>
            <Col>
                {
                /* button for vis, clicking on it will open the list of visualizations supported */
                }
                <Button id="space" variant="outline-secondary" onClick={() => setVisOpen(!visOpen)} aria-controls="example-collapse-text" aria-expanded={visOpen}>
                    <FaChartBar /> VIS
                </Button>

                {
                /* list of visualizations */
                }
                <Collapse in={visOpen}>
                    <Form>
                        <Form.Group className="mb-3" controlId="formBarVisCheckbox" id="space">
                            <Form.Check type="checkbox" label="Bar Chart"  onChange={handleBarCheckBoxChange}/>
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="formScatterVisCheckbox" id="space">
                            <Form.Check type="checkbox" label="Scatter Plot" onChange={handleScatterCheckBoxChange}/>
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="formHeatmapVisCheckbox" id="space">
                            <Form.Check type="checkbox" label="Heat Map" onChange={handleHeatmapCheckBox}/>
                        </Form.Group>
                    </Form>        
                </Collapse>
            </Col>
        </Row>);
}