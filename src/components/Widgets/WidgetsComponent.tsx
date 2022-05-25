import { Col } from "react-bootstrap";

import "./WidgetsComponent.css";
import { DataWidget } from "./DataWidget";
import { VisWidget } from "./VisWidget";

type widgetProps = {
    barChartToggle: React.Dispatch<React.SetStateAction<any>>,
    scatterToggle: React.Dispatch<React.SetStateAction<any>>,
    heatmapToggle: React.Dispatch<React.SetStateAction<any>>
}
/**
 * 
 * @param barChartToggle react set state True | False
 * Handles the barchart view component
 *  
 * @returns 
 */
export const WidgetsComponent = ({
    barChartToggle,
    scatterToggle,
    heatmapToggle

}: widgetProps) => {

    return(
        <Col md={1}>
            {/* visualization widget */}
            <VisWidget 
                barChartToggle = {barChartToggle}
                scatterToggle = {scatterToggle}
                heatmapToggle = {heatmapToggle}
            />
            {/* data widget */}
            <DataWidget />      
        </Col>
    )

};

