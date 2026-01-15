import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
    // Configuración de Headers (CORS)
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-password');

    if (request.method === 'OPTIONS') return response.status(200).end();

    try {
        // --- 1. PÚBLICO: SOLICITUD DE EDICIÓN ---
        if (request.method === 'POST') {
            const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
            const { registro_id, nuevos_datos } = body;
            
            if (!registro_id || !nuevos_datos) return response.status(400).json({ error: "Faltan datos" });
            
            await sql`
                INSERT INTO ediciones_pendientes (registro_id, nuevos_datos) 
                VALUES (${registro_id}, ${JSON.stringify(nuevos_datos)}::jsonb)
            `;
            return response.status(200).json({ success: true });
        }

        // --- ZONA ADMIN (Verificación de Password) ---
        const password = request.headers['x-admin-password'];
        if (password !== 'admin2026') return response.status(401).json({ error: 'No autorizado' });

        // --- 2. ADMIN: VER SOLICITUDES ---
        if (request.method === 'GET') {
            const { rows } = await sql`
                SELECT e.id as solicitud_id, e.nuevos_datos, e.fecha, r.* FROM ediciones_pendientes e 
                JOIN registros r ON e.registro_id = r.id 
                ORDER BY e.fecha DESC;
            `;
            return response.status(200).json(rows);
        }

        // --- 3. ADMIN: APROBAR CAMBIOS (PUT) ---
        if (request.method === 'PUT') {
            const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
            const { solicitud_id, registro_id, datos_finales } = body;
            
            // Limpieza de datos (asegurar null si viene vacío)
            const tipoFinal = datos_finales.tipoEnlace || null;
            const muniFinal = datos_finales.municipio || ''; // Postgres prefiere string vacía si la columna es TEXT no nula, o null si lo permites.

            await sql`
                UPDATE registros SET 
                    institucion = ${datos_finales.institucion},
                    departamento = ${datos_finales.departamento},
                    municipio = ${muniFinal},
                    nombre_completo = ${datos_finales.nombre},
                    puesto = ${datos_finales.puesto},
                    unidad_direccion = ${datos_finales.unidad},
                    correo = ${datos_finales.correo},
                    celular = ${datos_finales.celular},
                    tipo_enlace = ${tipoFinal}
                WHERE id = ${registro_id}
            `;

            // Borrar de pendientes
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