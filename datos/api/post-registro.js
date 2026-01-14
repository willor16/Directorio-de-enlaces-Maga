import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method Not Allowed' });
  
  try {
    const { institucion, departamento, municipio, nombre, puesto, unidad, correo, celular } = request.body;
    
    // Validación básica
    if (!correo || !nombre) throw new Error('Faltan datos');

    await sql`
      INSERT INTO registros (institucion, departamento, municipio, nombre_completo, puesto, unidad_direccion, correo, celular)
      VALUES (${institucion}, ${departamento}, ${municipio}, ${nombre}, ${puesto}, ${unidad}, ${correo}, ${celular});
    `;
    
    return response.status(200).json({ success: true });
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
}