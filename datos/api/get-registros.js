import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
    // 1. Configurar los permisos (CORS)
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');

    if (request.method === 'OPTIONS') return response.status(200).end();

    try {
        // 2. --- EL CANDADO DE SEGURIDAD ---
        // Aquí capturamos la contraseña que envía el frontend
        const password = request.headers['x-admin-password'];

        // Si la contraseña NO es 'admin2026', bloqueamos el acceso
        if (password !== 'admin2026') {
            return response.status(401).json({ error: 'Acceso denegado: Contraseña incorrecta' });
        }

        // 3. Si la contraseña es correcta, entregamos los datos
        const { rows } = await sql`SELECT * FROM registros ORDER BY id DESC;`;
        return response.status(200).json({ data: rows });

    } catch (error) {
        return response.status(500).json({ error: error.message });
    }
}