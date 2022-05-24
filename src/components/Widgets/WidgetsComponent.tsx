import { Col } from "react-bootstrap";

import "./WidgetsComponent.css";
import { DataWidget } from "./DataWidget";
import { VisWidget } from "./VisWidget";

type widgetProps = {
    barChartToggle: React.Dispatch<React.SetStateAction<any>>
}
/**
 * 
 * @param barChartToggle react set state True | False
 * Handles the barchart view component
 *  
 * @returns 
 */
export const WidgetsComponent = ({barChartToggle}: widgetProps) => {
return(
    <Col md={1}>
        {/* visualization widget */}
        <VisWidget 
            barChartToggle = {barChartToggle}
        />
        {/* data widget */}
        <DataWidget />      
    </Col>
)

};

