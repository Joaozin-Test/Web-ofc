const API_URL =
    "https://admin-data.josealessandrosst.workers.dev";

const ALLOWED_ORIGIN =
    "https://manox-hub.pages.dev";

function corsHeaders() {
    return {
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json; charset=utf-8"
    };
}

function json(data, status = 200) {
    return new Response(
        JSON.stringify(data),
        {
            status,
            headers: corsHeaders()
        }
    );
}

async function getBody(request) {
    try {
        return await request.json();
    } catch {
        return {};
    }
}

async function apiFetch(path, options = {}) {

    const response = await fetch(
        `${API_URL}${path}`,
        {
            ...options,

            headers: {
                "Content-Type": "application/json",

                "x-manox-key":
                    options.apiKey,

                ...(options.headers || {})
            }
        }
    );

    const text =
        await response.text();

    let data;

    try {
        data = JSON.parse(text);
    } catch {
        data = {
            success: response.ok,
            message: text
        };
    }

    return {
        response,
        data
    };
}


export async function onRequestOptions() {

    return new Response(null, {
        status: 204,
        headers: corsHeaders()
    });

}


export async function onRequest(context) {

    const {
        request,
        env
    } = context;

    /*
     * A chave fica somente no Cloudflare.
     */

    const ADMIN_API_KEY =
        env.ADMIN_API_KEY;

    if (!ADMIN_API_KEY) {

        return json(
            {
                success: false,
                message:
                    "ADMIN_API_KEY não configurada no Cloudflare."
            },
            500
        );

    }


    const body =
        await getBody(request);

    /*
     * O navegador envia a chave
     * somente para autenticação inicial.
     */

    const suppliedKey =
        body.key ||
        request.headers.get(
            "x-admin-key"
        );


    /*
     * Verificar a chave.
     */

    if (
        !suppliedKey ||
        suppliedKey !== ADMIN_API_KEY
    ) {

        return json(
            {
                success: false,
                authenticated: false,
                message:
                    "ADMIN_API_KEY inválida."
            },
            401
        );

    }


    /*
     * GET = retornar todos os dados
     */

    if (request.method === "GET") {

        const result =
            await apiFetch(
                "/api/manox/all-roles",
                {
                    apiKey:
                        ADMIN_API_KEY
                }
            );


        return json(
            {
                success:
                    result.response.ok,

                authenticated:
                    true,

                data:
                    result.data
            },
            result.response.status
        );

    }


    /*
     * POST = executar uma ação administrativa
     */

    if (request.method === "POST") {

        const action =
            body.action;


        const payload =
            body.payload || {};


        let endpoint;


        /*
         * TEMP ADMINS
         */

        if (
            action ===
            "temp-admin-add"
        ) {

            endpoint =
                "/api/manox/temp-admins/add";

        }

        else if (
            action ===
            "temp-admin-edit-expire"
        ) {

            endpoint =
                "/api/manox/temp-admins/edit-expire";

        }

        else if (
            action ===
            "temp-admin-remove"
        ) {

            endpoint =
                "/api/manox/temp-admins/remove";

        }


        /*
         * ADMINS PERMANENTES
         */

        else if (
            action ===
            "admin-list"
        ) {

            const result =
                await apiFetch(
                    "/api/manox/admins",
                    {
                        method: "GET",
                        apiKey:
                            ADMIN_API_KEY
                    }
                );

            return json(
                {
                    success:
                        result.response.ok,

                    authenticated:
                        true,

                    data:
                        result.data
                },
                result.response.status
            );

        }

        else if (
            action ===
            "admin-add"
        ) {

            endpoint =
                "/api/manox/admins/add";

        }

        else if (
            action ===
            "admin-remove"
        ) {

            endpoint =
                "/api/manox/admins/remove";

        }


        /*
         * OWNERS
         */

        else if (
            action ===
            "owner-list"
        ) {

            const result =
                await apiFetch(
                    "/api/manox/owners",
                    {
                        method: "GET",
                        apiKey:
                            ADMIN_API_KEY
                    }
                );

            return json(
                {
                    success:
                        result.response.ok,

                    authenticated:
                        true,

                    data:
                        result.data
                },
                result.response.status
            );

        }

        else if (
            action ===
            "owner-add"
        ) {

            endpoint =
                "/api/manox/owners/add";

        }

        else if (
            action ===
            "owner-remove"
        ) {

            endpoint =
                "/api/manox/owners/remove";

        }


        /*
         * AÇÃO DESCONHECIDA
         */

        else {

            return json(
                {
                    success: false,
                    message:
                        "Ação administrativa desconhecida."
                },
                400
            );

        }


        /*
         * Executar ação na API.
         */

        const result =
            await apiFetch(
                endpoint,
                {
                    method: "POST",

                    apiKey:
                        ADMIN_API_KEY,

                    body:
                        JSON.stringify(payload)
                }
            );


        return json(
            {
                success:
                    result.response.ok,

                authenticated:
                    true,

                data:
                    result.data
            },
            result.response.status
        );

    }


    return json(
        {
            success: false,
            message:
                "Método não permitido."
        },
        405
    );

}
