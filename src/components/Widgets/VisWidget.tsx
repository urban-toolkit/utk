import { useState } from "react";
import { Row, Col, Button, Collapse, Form } from "react-bootstrap";
import { FaChartBar } from "react-icons/fa";

/** 
 * Component creates the VIS menu and handles
 * view or hiding the visualization
*/
type visWidProps = {
    barChartToggle: React.Dispatch<React.SetStateAction<any>>;
}

export const VisWidget = ({barChartToggle}:visWidProps) =>{
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
                        <Form.Group className="mb-3" controlId="formBasicCheckbox" id="space">
                            <Form.Check type="checkbox" label="Bar Chart"  onChange={handleBarCheckBoxChange}/>
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="formBasicCheckbox" id="space">
                            <Form.Check type="checkbox" label="Scatter Plot" />
                        </Form.Group>
                        <Form.Group className="mb-3" controlId="formBasicCheckbox" id="space">
                            <Form.Check type="checkbox" label="Heat Map" />
                        </Form.Group>
                    </Form>        
                </Collapse>
            </Col>
        </Row>);
}