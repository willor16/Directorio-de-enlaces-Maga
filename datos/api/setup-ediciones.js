import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS ediciones_pendientes (
                id SERIAL PRIMARY KEY,
                registro_id INT NOT NULL,
                nuevos_datos JSONB NOT NULL,
                fecha TIMESTAMP DEFAULT NOW()
            );
        `;
        return response.status(200).json({ message: "Tabla ediciones_pendientes creada exitosamente" });
    } catch (error) {
        return response.status(500).json({ error: error.message });
    }
} 