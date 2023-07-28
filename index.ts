import { Buchta } from "buchta";
import { basename, dirname } from "path";
import { BuchtaLogger } from "buchta/src/utils/logger";
import { ObjectRawResponseReturn } from "vixeny/optimizer/types";

const extraRoutes: Map<string, any> = new Map();

const earlyHook = (build: Buchta) => {
    build.on("fileLoad", (data) => {
        data.route = "/" + basename(data.path);
        const func = async (_: any) => {
            return new Response(await Bun.file(data.path).arrayBuffer());
        }

        extraRoutes.set(data.route, func);
    })
}

const fixRoute = (route: string) => {
    if (!route.endsWith("/")) {
        route += "/";
    }

    return route;
}

export const buchta = async (): Promise<ObjectRawResponseReturn[]> => {
    const buchta = new Buchta();
    buchta.earlyHook = earlyHook;
    const routes: ObjectRawResponseReturn[] = [];

    await buchta.setup();
    for (const [route, func] of extraRoutes) {
        routes.push({
            path: route,
            type: "response",
            r: func
        });
    }

    // @ts-ignore I forgot this.pages 💀
    for (const route of buchta.pages) {
        if (route.func) {
            routes.push({
                path: fixRoute(dirname(route.route)),
                type: "response",
                r: async (_: any) => {
                    return new Response(await route.func(dirname(route.route), fixRoute(dirname(route.route))),
                                        { headers: { "Content-Type": "text/html" } });
                }
            });
        } else {
            if (!buchta.config?.ssr && "html" in route) {
                routes.push({
                    path: fixRoute(dirname(route.route)),
                    type: "response",
                    r: (_: any) => {
                        return new Response(route.html, { headers: { "Content-Type": "text/html" } });
                    }
                });
            }
            if (!("html" in route)) {
                routes.push({
                    path: route.route,
                    type: "response",
                    r: async (_: any) => {
                        return new Response(await Bun.file(route.path).arrayBuffer());
                    }
                })
                routes.push({
                    path: route.originalRoute,
                    type: "response",
                    r: async (_: any) => {
                        return new Response(await Bun.file(route.path).arrayBuffer());
                    }
                })
            }
        }
    }
    const logger = BuchtaLogger(false);
    logger("Buchta is running on top of vixeny!", "info");

    return routes;
}
