import Express from 'express'
import  cors from "cors";
import  cookieParser from 'cookie-parser'; 
import { ProxyRouter } from '../services/proxy-router.services'; 

export class ExpressConfiguration {
    private static instance: ExpressConfiguration;
    application!: Express.Application;

    private constructor() { };

    static get(): ExpressConfiguration {
        if (!ExpressConfiguration.instance) {
            ExpressConfiguration.instance = new ExpressConfiguration();
        }
        return ExpressConfiguration.instance;
    }

    init(): ExpressConfiguration {
        if (!this.application) {
            this.application = Express();
        }
        return this;
    } 

    plug(): ExpressConfiguration {

        const corsOptions = {
            origin: `http://${process.env.FRONTEND}`, // Allow requests from this origin
            methods: 'GET,POST,PUT,DELETE',
            credentials: true, // Allow credentials (cookies, authorization headers, etc.) 
            allowedHeaders: ['Content-Type', 'Authorization'],
        };
        this.application.use(cors(corsOptions));
        this.application.use(cookieParser());
        this.application.use(Express.json());
        this.application.use(Express.urlencoded({ extended: true }));
  
        this.application.use(`/${process.env.API_VERSION}`, ProxyRouter.map());
     
        return this;
    }
}

const Application = ExpressConfiguration.get()
    .init()
    .plug()
    .application;
export {
    Application
};