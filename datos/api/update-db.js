import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
    try {
        // Agregamos la columna 'tipo_enlace' si no existe
        await sql`
            ALTER TABLE registros 
            ADD COLUMN IF NOT EXISTS tipo_enlace TEXT;
        `;
        return response.status(200).json({ message: "Columna tipo_enlace agregada correctamente." });
    } catch (error) {
        return response.status(500).json({ error: error.message });
    }
}