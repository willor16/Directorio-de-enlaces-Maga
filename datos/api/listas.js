import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');

    if (request.method === 'OPTIONS') return response.status(200).end();

    try {
        // --- GET: OBTENER LISTAS (Público) ---
        if (request.method === 'GET') {
            const { tipo, padre } = request.query;

            // 1. Si piden municipios de un departamento específico
            if (tipo === 'municipio' && padre) {
                const { rows } = await sql`SELECT * FROM configuracion WHERE categoria = 'municipio' AND padre = ${padre} ORDER BY valor ASC;`;
                return response.status(200).json(rows);
            }
            
            // 2. Si piden una categoría general
            if (tipo) {
                const { rows } = await sql`SELECT * FROM configuracion WHERE categoria = ${tipo} ORDER BY valor ASC;`;
                return response.status(200).json(rows);
            }

            // 3. Todo (para el admin)
            const { rows } = await sql`SELECT * FROM configuracion ORDER BY categoria, valor ASC;`;
            return response.status(200).json(rows);
        }

        // --- SEGURIDAD: VERIFICAR PASSWORD ---
        const password = request.headers['x-admin-password'];
        
        // CORRECCIÓN 1: Ponemos la contraseña fija aquí (debe coincidir con la de admin.js)
        const passwordCorrecta = 'admin2026'; 

        if (password !== passwordCorrecta) {
            return response.status(401).json({ error: 'Contraseña incorrecta' });
        }

        // --- POST: AGREGAR NUEVO ---
        if (request.method === 'POST') {
            // CORRECCIÓN 2: Vercel a veces ya entrega el body parseado.
            // Esto evita errores si 'request.body' ya es un objeto.
            const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
            
            const { categoria, valor, padre } = body;
            
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
        console.error(error);
        return response.status(500).json({ error: error.message });
    }
}