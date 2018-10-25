export declare function density(temp: number, elevation: number, weight: number): number;
export declare function maxAbortDry(denRat: number, rwyLen: number, weight: number, wind: number): number;
export declare function maxAbortWet(denRat: number, rwyLen: number, weight: number, wind: number): number;
export declare function takeoffDist(temp: number, elevation: number, weight: number, wingStores: boolean, wind: number): number;
export declare function takeoffSpeeds(weight: number, cg: number): [number, number, number];
export declare function seTakeoffSpeeds(weight: number, wingStores: boolean): [number, number, number];
export declare function landingDist(denRat: number, weight: number, wind: number): [number, number];
export declare function minGo(denRat: number, rwyLen: number, weight: number, wingStores: boolean): number;
