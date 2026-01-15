import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    
    if (request.method === 'OPTIONS') return response.status(200).end();

    if (request.method === 'POST') {
        try {
            const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
            const { institucion, departamento, municipio, nombre, puesto, unidad, correo, celular } = body;

            await sql`
                INSERT INTO registros (institucion, departamento, municipio, nombre_completo, puesto, unidad_direccion, correo, celular)
                VALUES (${institucion}, ${departamento}, ${municipio}, ${nombre}, ${puesto}, ${unidad}, ${correo}, ${celular});
            `;

            return response.status(200).json({ success: true });
        } catch (error) {
            return response.status(500).json({ error: error.message });
        }
    }
}