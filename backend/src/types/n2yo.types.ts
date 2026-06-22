export interface SatellitePass {
    satid: number;
    satname: string;
    startUTC: number;
    maxUTC: number;
    endUTC: number;
    maxEl: number;
}