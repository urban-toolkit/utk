/*
    Configuration params for the application
*/

// Affects only CAVE2 support
export const paramsSendToUnity = {
    // Where the Order Server (controls order of exhibition of each slice of the map) is running
    orderServerIP: "localhost",
    orderServerPort: "4000",
    // Where the Unity server (receives canvas images) is running. The port is determined dynamically
    unityServerIP: "localhost"
}

// Affects all stages
export const paramsMapView = {
    // Where the Environment that serves data for the map is running (Master node IP if running in the CAVE2, localhost if running locally)
    environmentIP: "localhost",
    // Which data folder to load the data from
    environmentDataFolder: "data/wrf_temp_building"
}