import { Col } from "react-bootstrap";

import "./WidgetsComponent.css";
import { DataWidget } from "./DataWidget";
import { VisWidget } from "./VisWidget";

type widgetProps = {
    barChartToggle: React.Dispatch<React.SetStateAction<any>>
}
export const WidgetsComponent = ({barChartToggle}: widgetProps) => {
return(
    <Col md={1}>
        <VisWidget 
            barChartToggle = {barChartToggle}
        />
        <DataWidget />      
    </Col>
)

};

