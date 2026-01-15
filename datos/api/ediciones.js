import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
    // Headers CORS
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');

    if (request.method === 'OPTIONS') return response.status(200).end();

    try {
        // 1. PUBLICO: Enviar una solicitud de edición
        if (request.method === 'POST') {
            const { registro_id, nuevos_datos } = JSON.parse(request.body);
            
            // Guardamos la solicitud en la tabla temporal
            await sql`
                INSERT INTO ediciones_pendientes (registro_id, nuevos_datos) 
                VALUES (${registro_id}, ${JSON.stringify(nuevos_datos)}::jsonb)
            `;
            return response.status(200).json({ success: true });
        }

        // --- ZONA ADMIN (Requiere contraseña) ---
        const password = request.headers['x-admin-password'];
        const passwordCorrecta = 'admin2026'; // TU CONTRASEÑA

        if (password !== passwordCorrecta) {
            return response.status(401).json({ error: 'No autorizado' });
        }

        // 2. ADMIN: Ver todas las pendientes
        if (request.method === 'GET') {
            // Traemos la solicitud Y los datos originales actuales para comparar
            const { rows } = await sql`
                SELECT e.id as solicitud_id, e.nuevos_datos, e.fecha, r.* FROM ediciones_pendientes e
                JOIN registros r ON e.registro_id = r.id
                ORDER BY e.fecha DESC;
            `;
            return response.status(200).json(rows);
        }

        // 3. ADMIN: Aprobar (PUT) - Aplica los cambios y borra la solicitud
        if (request.method === 'PUT') {
            const { solicitud_id, registro_id, datos_finales } = JSON.parse(request.body);
            
            // Actualizamos el registro real
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

            // Borramos la solicitud pendiente
            await sql`DELETE FROM ediciones_pendientes WHERE id = ${solicitud_id}`;
            
            return response.status(200).json({ success: true });
        }

        // 4. ADMIN: Rechazar (DELETE) - Solo borra la solicitud
        if (request.method === 'DELETE') {
            const { solicitud_id } = request.query;
            await sql`DELETE FROM ediciones_pendientes WHERE id = ${solicitud_id}`;
            return response.status(200).json({ success: true });
        }

    } catch (error) {
        return response.status(500).json({ error: error.message });
    }
}       