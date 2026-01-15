import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
    // Headers CORS
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');

    if (request.method === 'OPTIONS') return response.status(200).end();

    try {
        // --- 1. PÚBLICO: SOLICITAR EDICIÓN ---
        if (request.method === 'POST') {
            // Parseo robusto: Si ya es objeto, úsalo; si es string, paréalo.
            const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
            
            const { registro_id, nuevos_datos } = body;

            // Validación básica
            if (!registro_id || !nuevos_datos) {
                return response.status(400).json({ error: "Faltan datos (ID o nuevos datos)" });
            }
            
            await sql`
                INSERT INTO ediciones_pendientes (registro_id, nuevos_datos) 
                VALUES (${registro_id}, ${JSON.stringify(nuevos_datos)}::jsonb)
            `;
            return response.status(200).json({ success: true });
        }

        // --- ZONA ADMIN (Requiere contraseña) ---
        const password = request.headers['x-admin-password'];
        const passwordCorrecta = 'admin2026'; 

        if (password !== passwordCorrecta) {
            return response.status(401).json({ error: 'No autorizado' });
        }

        // --- 2. ADMIN: VER SOLICITUDES ---
        if (request.method === 'GET') {
            const { rows } = await sql`
                SELECT e.id as solicitud_id, e.nuevos_datos, e.fecha, r.* FROM ediciones_pendientes e
                JOIN registros r ON e.registro_id = r.id
                ORDER BY e.fecha DESC;
            `;
            return response.status(200).json(rows);
        }

        // --- 3. ADMIN: APROBAR (PUT) ---
        if (request.method === 'PUT') {
            const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
            const { solicitud_id, registro_id, datos_finales } = body;
            
            // Actualizar registro original
            await sql`
                UPDATE registros SET 
                    institucion = ${datos_finales.institucion},
                    departamento = ${datos_finales.departamento},
                    municipio = ${datos_finales.municipio},
                    nombre_completo = ${datos_finales.nombre},
                    puesto = ${datos_finales.puesto},
                    unidad_direccion = ${datos_finales.unidad},
                    correo = ${datos_finales.correo},
                    celular = ${datos_finales.celular}
                WHERE id = ${registro_id}
            `;

            // Borrar solicitud
            await sql`DELETE FROM ediciones_pendientes WHERE id = ${solicitud_id}`;
            
            return response.status(200).json({ success: true });
        }

        // --- 4. ADMIN: RECHAZAR (DELETE) ---
        if (request.method === 'DELETE') {
            const { solicitud_id } = request.query;
            await sql`DELETE FROM ediciones_pendientes WHERE id = ${solicitud_id}`;
            return response.status(200).json({ success: true });
        }

    } catch (error) {
        console.error("Error API Ediciones:", error);
        return response.status(500).json({ error: error.message });
    }
}