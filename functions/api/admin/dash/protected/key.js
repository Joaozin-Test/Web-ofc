const API_URL =
    "https://admin-data.josealessandrosst.workers.dev";

const ALLOWED_ORIGIN =
    "https://manox-hub.pages.dev";


function corsHeaders() {

    return {
        "Access-Control-Allow-Origin":
            ALLOWED_ORIGIN,

        "Access-Control-Allow-Methods":
            "GET, POST, OPTIONS",

        "Access-Control-Allow-Headers":
            "Content-Type, x-manox-key",

        "Content-Type":
            "application/json; charset=utf-8"
    };

}


function json(data, status = 200) {

    return new Response(
        JSON.stringify(data),
        {
            status,

            headers:
                corsHeaders()
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


/*
 * Envia a requisição para o Worker
 * admin-data.
 *
 * A ADMIN_API_KEY não fica nesta Function.
 */

async function adminRequest(
    path,
    method,
    adminKey,
    body = null
) {

    const headers = {

        "Content-Type":
            "application/json",

        "x-manox-key":
            adminKey

    };


    const options = {

        method,

        headers

    };


    if (body !== null) {

        options.body =
            JSON.stringify(body);

    }


    const response =
        await fetch(
            `${API_URL}${path}`,
            options
        );


    const text =
        await response.text();


    let data;


    try {

        data =
            JSON.parse(text);

    } catch {

        data = {
            success:
                response.ok,

            message:
                text
        };

    }


    return {
        response,
        data
    };

}



/* =====================================================
   OPTIONS
===================================================== */

export async function onRequestOptions() {

    return new Response(
        null,
        {
            status: 204,
            headers:
                corsHeaders()
        }
    );

}



/* =====================================================
   MAIN
===================================================== */

export async function onRequest(
    context
) {

    const request =
        context.request;


    /*
     * Aceitar a chave enviada pelo
     * admin.html.
     */

    const body =
        await getBody(request);


    const adminKey =
        body.key ||
        request.headers.get(
            "x-manox-key"
        );


    if (!adminKey) {

        return json(
            {
                success: false,

                authenticated:
                    false,

                message:
                    "ADMIN_API_KEY não fornecida."
            },
            401
        );

    }



    /* =================================================
       GET
       Carregar todos os roles
    ================================================= */

    if (
        request.method === "GET"
    ) {

        const result =
            await adminRequest(
                "/api/manox/all-roles",

                "GET",

                adminKey
            );


        if (
            result.response.status === 401 ||
            result.response.status === 403
        ) {

            return json(
                {
                    success: false,

                    authenticated:
                        false,

                    message:
                        "ADMIN_API_KEY inválida."
                },
                401
            );

        }


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



    /* =================================================
       POST
       Ações administrativas
    ================================================= */

    if (
        request.method === "POST"
    ) {

        const action =
            body.action;


        const payload =
            body.payload || {};


        let endpoint =
            null;


        /*
         * TEMP ADMINS
         */

        switch (action) {

            case "temp-admin-add":

                endpoint =
                    "/api/manox/temp-admins/add";

                break;


            case "temp-admin-edit-expire":

                endpoint =
                    "/api/manox/temp-admins/edit-expire";

                break;


            case "temp-admin-remove":

                endpoint =
                    "/api/manox/temp-admins/remove";

                break;



            /*
             * ADMINS
             */

            case "admin-list":

                endpoint =
                    "/api/manox/admins";

                break;


            case "admin-add":

                endpoint =
                    "/api/manox/admins/add";

                break;


            case "admin-remove":

                endpoint =
                    "/api/manox/admins/remove";

                break;



            /*
             * OWNERS
             */

            case "owner-list":

                endpoint =
                    "/api/manox/owners";

                break;


            case "owner-add":

                endpoint =
                    "/api/manox/owners/add";

                break;


            case "owner-remove":

                endpoint =
                    "/api/manox/owners/remove";

                break;


            default:

                return json(
                    {
                        success: false,

                        message:
                            "Ação administrativa desconhecida."
                    },
                    400
                );

        }



        const method =
            action === "admin-list" ||
            action === "owner-list"

                ? "GET"

                : "POST";



        const result =
            await adminRequest(
                endpoint,

                method,

                adminKey,

                method === "POST"
                    ? payload
                    : null
            );



        /*
         * A API rejeitou a chave.
         */

        if (
            result.response.status === 401 ||
            result.response.status === 403
        ) {

            return json(
                {
                    success: false,

                    authenticated:
                        false,

                    message:
                        "ADMIN_API_KEY inválida."
                },
                401
            );

        }



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
