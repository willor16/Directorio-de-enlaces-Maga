import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
    try {
        // Esta instrucción crea la columna faltante
        await sql`
            ALTER TABLE registros 
            ADD COLUMN IF NOT EXISTS tipo_enlace TEXT;
        `;
        
        return response.status(200).json({ 
            estado: "EXITO", 
            mensaje: "La columna 'tipo_enlace' ha sido creada correctamente. Ya puedes guardar datos." 
        });
    } catch (error) {
        return response.status(500).json({ error: error.message });
    }
}