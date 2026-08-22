export async function onRequest(context) {

    const SCRIPT_URL =
        "https://raw.githubusercontent.com/JAGAMES94ez/Manox-Hub/refs/heads/main/Brookhaven";

    try {

        const response = await fetch(
            SCRIPT_URL,
            {
                cf: {
                    cacheTtl: 60,
                    cacheEverything: true
                }
            }
        );

        if (!response.ok) {

            return new Response(
                "-- Erro ao carregar o script",
                {
                    status: 502,
                    headers: {
                        "Content-Type":
                            "text/plain; charset=utf-8"
                    }
                }
            );

        }

        const script =
            await response.text();

        return new Response(
            script,
            {
                status: 200,

                headers: {
                    "Content-Type":
                        "text/plain; charset=utf-8",

                    "Cache-Control":
                        "public, max-age=60"
                }
            }
        );

    } catch (error) {

        return new Response(
            "-- Erro interno ao carregar o script",
            {
                status: 500,

                headers: {
                    "Content-Type":
                        "text/plain; charset=utf-8"
                }
            }
        );

    }

}
