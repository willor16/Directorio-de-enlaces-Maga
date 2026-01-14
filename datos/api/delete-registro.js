import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
  const { id } = request.query;
  try {
    await sql`DELETE FROM registros WHERE id = ${id};`;
    return response.status(200).json({ success: true });
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
}