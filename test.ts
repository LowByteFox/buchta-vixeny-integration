import vixeny from "vixeny/fun"
import { buchta } from "."

const routes = await buchta();

Bun.serve({
    port: 8080,
    hostname: "127.0.0.1",
    fetch: vixeny({ hasName: "http://127.0.0.1:8080/" })([
        {
            path: "/api",
            f: () => "Hey there!",
        },
        ...routes
    ]) 
})
