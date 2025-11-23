import { Router } from "express";
import {
  RoleRoutes, PermissionRoutes, StaffProfileRoutes , StaffRoutes, AuthRoutes
} from "../routes"; 
import { IRoute } from "../types/interfaces/route.interfaces";

class ProxyRouter {
    private static instance: ProxyRouter;
    private router: Router = Router();
    private readonly routes = [ 
        { segment: "/roles", provider: RoleRoutes },
        { segment: "/permissions", provider: PermissionRoutes },
        {segment : "/profiles" , provider : StaffProfileRoutes}, 
        {segment : "/staff" , provider : StaffRoutes}, 
        {segment : "/auth" , provider : AuthRoutes}
    ]

    private constructor() { }

    static get(): ProxyRouter {
        if (!ProxyRouter.instance) {
            ProxyRouter.instance = new ProxyRouter();
        }
        return ProxyRouter.instance;
    }

    map(): Router {
        this.routes.forEach((route: IRoute) => { 
            const instance = new route.provider() as { router: Router };
            this.router.use(route.segment, instance.router);
        }); 

        return this.router;
    }
}

const proxyRouter = ProxyRouter.get();

export { proxyRouter as ProxyRouter }