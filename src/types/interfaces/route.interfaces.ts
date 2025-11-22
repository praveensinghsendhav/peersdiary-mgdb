import { Router } from '../classes/index';

export interface IRoute {

    segment: string;

    provider: any | Router;

    serializable?: boolean;
}