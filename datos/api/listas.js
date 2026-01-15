import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');

    if (request.method === 'OPTIONS') return response.status(200).end();

    try {
        // --- GET: OBTENER LISTAS ---
        if (request.method === 'GET') {
            const { tipo, padre } = request.query;

            // Si piden municipios de un departamento específico
            if (tipo === 'municipio' && padre) {
                const { rows } = await sql`SELECT * FROM configuracion WHERE categoria = 'municipio' AND padre = ${padre} ORDER BY valor ASC;`;
                return response.status(200).json(rows);
            }
            
            // Si piden una categoría general (institucion, departamento, o todos los municipios)
            if (tipo) {
                const { rows } = await sql`SELECT * FROM configuracion WHERE categoria = ${tipo} ORDER BY valor ASC;`;
                return response.status(200).json(rows);
            }

            // Si no piden nada, devolvemos todo (útil para el admin)
            const { rows } = await sql`SELECT * FROM configuracion ORDER BY categoria, valor ASC;`;
            return response.status(200).json(rows);
        }

        // --- SEGURIDAD ---
        const password = request.headers['x-admin-password'];
        if (password !== process.env.ADMIN_PASSWORD) {
            return response.status(401).json({ error: 'Contraseña incorrecta' });
        }

        // --- POST: AGREGAR NUEVO ---
        if (request.method === 'POST') {
            const body = JSON.parse(request.body);
            const { categoria, valor, padre } = body;
            
            // El campo "padre" es opcional (solo para municipios)
            await sql`INSERT INTO configuracion (categoria, valor, padre) VALUES (${categoria}, ${valor}, ${padre || null});`;
            return response.status(200).json({ success: true });
        }

        // --- DELETE: BORRAR ---
        if (request.method === 'DELETE') {
            const id = request.query.id;
            await sql`DELETE FROM configuracion WHERE id = ${id};`;
            return response.status(200).json({ success: true });
        }

    } catch (error) {
        return response.status(500).json({ error: error.message });
    }
}