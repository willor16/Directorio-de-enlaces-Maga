import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
  // Aquí podrías validar un token de "admin" si quisieras más seguridad
  try {
    const { rows } = await sql`SELECT * FROM registros ORDER BY id DESC;`;
    return response.status(200).json({ data: rows });
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
}