import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    if (request.method === 'OPTIONS') return response.status(200).end();

    if (request.method === 'GET') {
        try {
            const { rows } = await sql`SELECT * FROM registros ORDER BY id DESC;`;
            return response.status(200).json({ data: rows });
        } catch (error) {
            return response.status(500).json({ error: error.message });
        }
    }
    return response.status(405).json({ error: 'Method not allowed' });
}