/**
 * Vercel Serverless Function: Contentful CDA Proxy
 *
 * Kapselt den Contentful Access Token als Umgebungsvariable.
 * Der Token ist NICHT im Frontend-Code — nur diese Funktion kennt ihn.
 *
 * Aufruf vom Client:  GET /api/contentful?path=entries&content_type=blogArtikel&...
 */
export default async function handler(req, res) {
    const spaceId   = process.env.CONTENTFUL_SPACE_ID;
    const token     = process.env.CONTENTFUL_ACCESS_TOKEN;

    if (!spaceId || !token) {
        return res.status(500).json({ error: 'Contentful nicht konfiguriert' });
    }

    // 'path' aus den Query-Params extrahieren (z.B. 'entries')
    const { path, ...rest } = req.query;
    const cfPath    = path || 'entries';
    const queryStr  = new URLSearchParams(rest).toString();

    const url = `https://cdn.contentful.com/spaces/${spaceId}/environments/master/${cfPath}?${queryStr}&access_token=${token}`;

    try {
        const cfRes = await fetch(url);
        const data  = await cfRes.json();

        // Kurzzeit-Cache: 60s frisch, 5min stale
        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
        res.setHeader('Access-Control-Allow-Origin', '*');

        return res.status(cfRes.status).json(data);
    } catch (err) {
        console.error('Contentful Proxy Fehler:', err.message);
        return res.status(500).json({ error: 'Contentful nicht erreichbar' });
    }
}
