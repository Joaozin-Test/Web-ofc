const API_URL = "https://admin-data.josealessandrosst.workers.dev";
const ALLOWED_ORIGIN = "https://manox-hub.pages.dev";

function corsHeaders() {
    return {
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, x-admin-key",
        "Content-Type": "application/json; charset=utf-8"
    };
}

function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: corsHeaders()
    });
}

async function getBody(request) {
    // Evita ler body se o método for GET ou HEAD
    if (request.method === "GET" || request.method === "HEAD") {
        return {};
    }
    try {
        return await request.json();
    } catch {
        return {};
    }
}

async function adminRequest(path, method, adminKey, body = null) {
    const headers = {
        "Content-Type": "application/json",
        "x-manox-key": adminKey
    };

    const options = { method, headers };

    if (body !== null) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${path}`, options);
    const text = await response.text();

    let data;
    try {
        data = JSON.parse(text);
    } catch {
        data = { success: response.ok, message: text };
    }

    return { response, data };
}

export async function onRequestOptions() {
    return new Response(null, {
        status: 204,
        headers: corsHeaders()
    });
}

export async function onRequest(context) {
    const { request } = context;

    // Leitura condicional da chave (Header prioritário para GET)
    const body = await getBody(request);
    const adminKey = request.headers.get("x-admin-key") || body.key;

    if (!adminKey) {
        return json(
            {
                success: false,
                authenticated: false,
                message: "ADMIN_API_KEY não fornecida."
            },
            401
        );
    }

    /* GET - Carregar todos os roles */
    if (request.method === "GET") {
        const result = await adminRequest("/api/manox/all-roles", "GET", adminKey);

        if (result.response.status === 401 || result.response.status === 403) {
            return json(
                {
                    success: false,
                    authenticated: false,
                    message: "ADMIN_API_KEY inválida."
                },
                401
            );
        }

        return json(
            {
                success: result.response.ok,
                authenticated: true,
                data: result.data
            },
            result.response.status
        );
    }

    /* POST - Ações administrativas */
    if (request.method === "POST") {
        const { action, payload = {} } = body;

        const endpoints = {
            "temp-admin-add": "/api/manox/temp-admins/add",
            "temp-admin-edit-expire": "/api/manox/temp-admins/edit-expire",
            "temp-admin-remove": "/api/manox/temp-admins/remove",
            "admin-list": "/api/manox/admins",
            "admin-add": "/api/manox/admins/add",
            "admin-remove": "/api/manox/admins/remove",
            "owner-list": "/api/manox/owners",
            "owner-add": "/api/manox/owners/add",
            "owner-remove": "/api/manox/owners/remove"
        };

        const endpoint = endpoints[action];

        if (!endpoint) {
            return json(
                {
                    success: false,
                    message: "Ação administrativa desconhecida."
                },
                400
            );
        }

        const method = action.endsWith("-list") ? "GET" : "POST";
        const result = await adminRequest(
            endpoint,
            method,
            adminKey,
            method === "POST" ? payload : null
        );

        if (result.response.status === 401 || result.response.status === 403) {
            return json(
                {
                    success: false,
                    authenticated: false,
                    message: "ADMIN_API_KEY inválida."
                },
                401
            );
        }

        return json(
            {
                success: result.response.ok,
                authenticated: true,
                data: result.data
            },
            result.response.status
        );
    }

    return json(
        {
            success: false,
            message: "Método não permitido."
        },
        405
    );
}
