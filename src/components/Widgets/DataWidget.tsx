import { useState } from "react";
// bootstrap component
import { Button, Col, Collapse, Form, Row } from "react-bootstrap";
// icon
import { BiData } from "react-icons/bi";

// DataWidget component parameters
type dataWidgetProps = {
    onCityRefChange: React.ChangeEventHandler<HTMLInputElement>
}

/**
 * 
 * @param onCityRefChange - handles which data set should be loaded in the map view
 * @returns 
 */

export function DataWidget({onCityRefChange}:dataWidgetProps) {
    const [dataOpen, setdataOpen] = useState(false)   

    return (<Row>
            <Col>
                    {
                    /* button for data, clicking on it will open the list of data */
                    }
                    <Button id="space" variant="outline-secondary" onClick={() => setdataOpen(!dataOpen)} aria-controls="example-collapse-text" aria-expanded={dataOpen}>
                            <BiData /> Data
                    </Button>

                    {
                    /* list of cities */
                    }
                    <Collapse in={dataOpen}>
                        <Form>
                            <Form.Group className="mb-3" controlId="formDataCheckbox" id="space">
                                <Form.Check 
                                    type="radio" 
                                    label="Chicago" 
                                    name="city" 
                                    value='Chicago'
                                    onChange={onCityRefChange} 
                                    defaultChecked/>
                                <Form.Check 
                                    type="radio" 
                                    label="New York" 
                                    name="city" 
                                    value='NewYork'
                                    onChange={onCityRefChange} 
                                />
                            </Form.Group>
                        </Form>        
                    </Collapse>
            </Col>
        </Row>);
}