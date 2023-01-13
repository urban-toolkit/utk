import { useState } from "react";
// bootstrap component
import { Row, Col, Button, Collapse, Form } from "react-bootstrap";
// icon
import { FaChartBar } from "react-icons/fa";


// VisWidget parameter types
type visWidProps = {
    genericScreenPlotToggle: React.Dispatch<React.SetStateAction<any>>
}

/** 
 * Component creates the VIS menu and handles
 * view or hiding the visualization
*/

export const VisWidget = ({
    genericScreenPlotToggle
}:visWidProps) =>{
    // state controlling the collapse
    const [visOpen, setVisOpen] = useState(false)

    /**
     * state variables controlling the checkbox toggles
     * if checked will show the visualization
     * if not hide the visualization
     */

    const [genericScreenPlotCheckBox, setGenericScreenPlotCheckBox] = useState(false);

    const handleGenericScreenPlotCheckBoxChange = () => {
        setGenericScreenPlotCheckBox(!genericScreenPlotCheckBox)
        genericScreenPlotToggle(!genericScreenPlotCheckBox)        

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
                            <Form.Check type="checkbox" label="Generic Plot"  onChange={handleGenericScreenPlotCheckBoxChange}/>
                        </Form.Group>
                    </Form>        
                </Collapse>
            </Col>
        </Row>);
}