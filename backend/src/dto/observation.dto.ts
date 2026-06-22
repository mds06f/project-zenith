import { ObservationFactorsDto } from "./observation-factors.dto";

export interface ObservationDto {

    score: number;

    condition: string;

    factors: ObservationFactorsDto;

}