import { Row, Col, Button, Collapse, Form } from "react-bootstrap";

//import useState hook to create menu collapse state
import React, { useState } from "react";
import {  FaChartBar } from "react-icons/fa";
import { BiData } from "react-icons/bi";

import "./WidgetsComponent.css";


export const WidgetsComponent = () => {
// collapse button state for VIS
const [visOpen, setVisOpen] = useState(false)
const [dataOpen, setdataOpen] = useState(false)

return(
    <Col md={1}>
        <Row>
            <Col>
                {/* button for vis, clicking on it will open the list of visualizations supported */}
                <Button
                    id="space"
                    variant="outline-secondary"
                    onClick={() => setVisOpen(!visOpen)}
                    aria-controls="example-collapse-text"
                    aria-expanded={visOpen}
                >
                    <FaChartBar/> VIS
                </Button>

                {/* list of visualizations */}
                <Collapse in={visOpen}>
                    <Form>
                        <Form.Group className="mb-3" controlId="formBasicCheckbox" id="space">
                            <Form.Check type="checkbox" label="Bar Chart" />
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
        </Row>
        <Row>
            <Col>
                {/* button for data, clicking on it will open the list of data */}
                <Button
                    id="space"
                    variant="outline-secondary"
                    onClick={() => setdataOpen(!dataOpen)}
                    aria-controls="example-collapse-text"
                    aria-expanded={dataOpen}
                    >
                        <BiData/> Data
                    </Button>

                    {/* list of visualizations */}
                    <Collapse in={dataOpen}>
                        <Form>
                            <Form.Group className="mb-3" controlId="formBasicCheckbox" id="space">
                                <Form.Check type="radio" label="Chicago" name="city"/>
                                <Form.Check type="radio" label="New York" name="city" />
                            </Form.Group>
                        </Form>        
                </Collapse>
            </Col>
        </Row>


        
    </Col>
)

};

