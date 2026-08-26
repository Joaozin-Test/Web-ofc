const ADMIN_API =
    "https://admin-data.josealessandrosst.workers.dev";

const ALLOWED_ORIGIN =
    "https://manox-hub.pages.dev";


function cors() {
    return {
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers":
            "Content-Type, x-admin-key",
        "Content-Type":
            "application/json; charset=utf-8"
    };
}


function response(data, status = 200) {
    return new Response(
        JSON.stringify(data),
        {
            status,
            headers: cors()
        }
    );
}


export async function onRequestOptions() {

    return new Response(null, {
        status: 204,
        headers: cors()
    });

}


export async function onRequest(context) {

    const request =
        context.request;


    /*
     * =================================================
     * GET
     *
     * Usado pelo admin.html para carregar
     * owners, admins e tempAdmins.
     * =================================================
     */

    if (request.method === "GET") {

        const key =
            request.headers.get(
                "x-admin-key"
            );


        if (!key) {

            return response({
                success: false,
                authenticated: false,
                message:
                    "ADMIN_API_KEY não fornecida."
            }, 401);

        }


        const apiResponse =
            await fetch(
                `${ADMIN_API}/api/manox/all-roles`,
                {
                    method: "GET",

                    headers: {
                        "x-manox-key": key
                    }
                }
            );


        const text =
            await apiResponse.text();


        let data;

        try {
            data = JSON.parse(text);
        } catch {
            data = {
                success:
                    apiResponse.ok,
                message:
                    text
            };
        }


        /*
         * Como /all-roles atualmente é público
         * no seu server.js, precisamos validar a
         * chave aqui.
         *
         * Para isso, fazemos uma requisição de
         * teste a uma rota realmente protegida.
         */

        const verifyResponse =
            await fetch(
                `${ADMIN_API}/api/manox/admins`,
                {
                    method: "GET",

                    headers: {
                        "x-manox-key": key
                    }
                }
            );


        if (
            verifyResponse.status === 401 ||
            verifyResponse.status === 403
        ) {

            return response({
                success: false,
                authenticated: false,
                message:
                    "ADMIN_API_KEY inválida."
            }, 401);

        }


        return response({
            success: true,
            authenticated: true,
            data
        });

    }



    /*
     * =================================================
     * POST
     * =================================================
     */

    if (request.method === "POST") {

        let body;

        try {
            body =
                await request.json();
        } catch {
            body = {};
        }


        /*
         * Login:
         *
         * admin.html envia:
         *
         * {
         *   "key": "..."
         * }
         */

        if (
            body.key &&
            !body.action
        ) {

            const key =
                body.key;


            const verifyResponse =
                await fetch(
                    `${ADMIN_API}/api/manox/admins`,
                    {
                        method: "GET",

                        headers: {
                            "x-manox-key":
                                key
                        }
                    }
                );


            if (
                verifyResponse.status === 401 ||
                verifyResponse.status === 403
            ) {

                return response({
                    success: false,
                    authenticated: false,
                    message:
                        "ADMIN_API_KEY inválida."
                }, 401);

            }


            return response({
                success: true,
                authenticated: true,
                message:
                    "ADMIN_API_KEY válida."
            });

        }


        /*
         * =================================================
         * AÇÕES ADMINISTRATIVAS
         * =================================================
         */

        const key =
            request.headers.get(
                "x-admin-key"
            );


        if (!key) {

            return response({
                success: false,
                message:
                    "ADMIN_API_KEY não fornecida."
            }, 401);

        }


        const action =
            body.action;


        const payload =
            body.payload || {};


        const routes = {

            "temp-admin-add":
                "/api/manox/temp-admins/add",

            "temp-admin-edit-expire":
                "/api/manox/temp-admins/edit-expire",

            "temp-admin-remove":
                "/api/manox/temp-admins/remove",

            "admin-add":
                "/api/manox/admins/add",

            "admin-remove":
                "/api/manox/admins/remove",

            "owner-add":
                "/api/manox/owners/add",

            "owner-remove":
                "/api/manox/owners/remove",

            "system-message":
                "/api/manox/system-message",

            "chat-clear":
                "/api/manox/chat/clear",

            "server-chat-clear":
                "/api/manox/server-chat/clear"
        };


        const endpoint =
            routes[action];


        if (!endpoint) {

            return response({
                success: false,
                message:
                    "Ação desconhecida."
            }, 400);

        }


        const apiResponse =
            await fetch(
                `${ADMIN_API}${endpoint}`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "x-manox-key":
                            key
                    },

                    body:
                        JSON.stringify(payload)
                }
            );


        const text =
            await apiResponse.text();


        let data;

        try {
            data = JSON.parse(text);
        } catch {
            data = {
                success:
                    apiResponse.ok,
                message:
                    text
            };
        }


        return response(
            data,
            apiResponse.status
        );

    }


    return response({
        success: false,
        message:
            "Método não permitido."
    }, 405);

}
