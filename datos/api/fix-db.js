import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
    try {
        // Esta línea es la magia: Agrega la columna si no existe
        await sql`
            ALTER TABLE registros 
            ADD COLUMN IF NOT EXISTS tipo_enlace TEXT;
        `;
        
        return response.status(200).json({ 
            message: "¡ÉXITO! Base de datos reparada. La columna 'tipo_enlace' ha sido creada." 
        });
    } catch (error) {
        return response.status(500).json({ error: error.message });
    }
}