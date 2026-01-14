import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
  if (request.method !== 'PUT') return response.status(405).json({ error: 'Method Not Allowed' });
  const { id, institucion, departamento, municipio, nombre, puesto, unidad, correo, celular } = request.body;

  try {
    await sql`
      UPDATE registros 
      SET institucion=${institucion}, departamento=${departamento}, municipio=${municipio}, 
          nombre_completo=${nombre}, puesto=${puesto}, unidad_direccion=${unidad}, 
          correo=${correo}, celular=${celular}
      WHERE id=${id};
    `;
    return response.status(200).json({ success: true });
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
}