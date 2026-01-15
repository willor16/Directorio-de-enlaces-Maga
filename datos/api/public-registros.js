import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
    // Permitir que cualquiera lea esto (CORS abierto)
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    if (request.method === 'OPTIONS') return response.status(200).end();

    if (request.method === 'GET') {
        try {
            // Traemos todos los registros ordenados por Institución para que se vea ordenado
            const { rows } = await sql`SELECT * FROM registros ORDER BY institucion ASC, nombre_completo ASC;`;
            
            return response.status(200).json({ data: rows });
        } catch (error) {
            console.error(error);
            return response.status(500).json({ error: error.message });
        }
    }
    
    return response.status(405).json({ error: 'Método no permitido' });
}