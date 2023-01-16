// bootstrap components
import { Col } from "react-bootstrap";
//css file
import "./WidgetsComponent.css";
// data and vis widgets components
import { DataWidget } from "./DataWidget";
import { VisWidget } from "./VisWidget";

// value types that are being passed in the function parameter
type widgetProps = {
    genericScreenPlotToggle: React.Dispatch<React.SetStateAction<any>>,
    addGenericPlot: React.Dispatch<React.SetStateAction<any>>,
    onCityRefChange: React.ChangeEventHandler
}
/**
 * @function WidgetsComponent - widgets container
 * handles Vis widgets and Data widgets
 * 
 * Vis Widgets parameters
 * @param genericScreenPlotToggle
 *   react set state True | False
 *  Handles whether to view the corresponding components or not 
 *  
 * Data Widgets parameters - mapview
 * @param onCityRefChange handles the data load
 * @returns 
 */
export const WidgetsComponent = ({
    genericScreenPlotToggle,
    addGenericPlot,
    onCityRefChange

}: widgetProps) => {

    return(
        <Col md={1}>
            {/* visualization widget */}
            <VisWidget 
                genericScreenPlotToggle = {genericScreenPlotToggle}
                addGenericPlot = {addGenericPlot}
            />
            {/* data widget */}
            <DataWidget 
                onCityRefChange = {onCityRefChange}
            />      
        </Col>
    )

};

