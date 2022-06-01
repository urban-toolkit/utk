// bootstrap components
import { Col } from "react-bootstrap";
//css file
import "./WidgetsComponent.css";
// data and vis widgets components
import { DataWidget } from "./DataWidget";
import { VisWidget } from "./VisWidget";

// value types that are being passed in the function parameter
type widgetProps = {
    barChartToggle: React.Dispatch<React.SetStateAction<any>>,
    scatterToggle: React.Dispatch<React.SetStateAction<any>>,
    heatmapToggle: React.Dispatch<React.SetStateAction<any>>,
    onCityRefChange: React.ChangeEventHandler
}
/**
 * @function WidgetsComponent - widgets container
 * handles Vis widgets and Data widgets
 * 
 * Vis Widgets parameters
 * @param barChartToggle
 * @param scatterToggle
 * @param heatmapToggle
 *   react set state True | False
 *  Handles whether to view the corresponding components or not 
 *  
 * Data Widgets parameters - mapview
 * @param onCityRefChange handles the data load
 * @returns 
 */
export const WidgetsComponent = ({
    barChartToggle,
    scatterToggle,
    heatmapToggle,
    onCityRefChange

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
            <DataWidget 
                onCityRefChange = {onCityRefChange}
            />      
        </Col>
    )

};

