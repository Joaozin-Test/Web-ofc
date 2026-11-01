export async function onRequest() {
    const API_URL =
        "https://users-data.manoxhub.workers.dev/api/manox/test-script";

    const textHeaders = {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-Content-Type-Options": "nosniff"
    };

    try {
        const response = await fetch(API_URL, {
            method: "GET",
            headers: { "Accept": "application/json" },
            cf: { cacheTtl: 0, cacheEverything: false }
        });

        if (!response.ok) {
            return new Response(
                "-- Manox Test Script: erro ao consultar o Worker (" +
                    response.status +
                    ")",
                { status: 502, headers: textHeaders }
            );
        }

        const data = await response.json();

        if (!data || data.success !== true || typeof data.script !== "string") {
            return new Response(
                "-- Manox Test Script: resposta inválida do Worker",
                { status: 502, headers: textHeaders }
            );
        }

        return new Response(data.script, {
            status: 200,
            headers: textHeaders
        });
    } catch (error) {
        return new Response(
            "-- Manox Test Script: falha de conexão com o Worker",
            { status: 502, headers: textHeaders }
        );
    }
}
