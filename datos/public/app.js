document.addEventListener('DOMContentLoaded', async () => {
    // Cargas iniciales
    await cargarSelect('/api/listas?tipo=institucion', 'institucion');
    await cargarSelect('/api/listas?tipo=departamento', 'departamento');
    gestionarTerritorio(); // Configurar estado inicial del formulario
    cargarDirectorioPublico(); // Cargar la tabla pública
});

// --- LÓGICA DEL FORMULARIO DE REGISTRO ---

async function cargarSelect(url, idElemento) {
    try {
        const res = await fetch(url);
        const datos = await res.json();
        const select = document.getElementById(idElemento);
        select.innerHTML = '<option value="" disabled selected>Seleccione...</option>';
        datos.forEach(item => {
            const opt = document.createElement('option');
            opt.value = item.valor;
            opt.innerText = item.valor;
            select.appendChild(opt);
        });
    } catch (error) { console.error("Error cargando lista:", error); }
}

window.gestionarTerritorio = function() {
    const tipo = document.getElementById('tipoEnlace').value;
    const divMunicipio = document.getElementById('divMunicipio');
    const selectMunicipio = document.getElementById('municipio');

    if (tipo === 'departamental') {
        divMunicipio.style.display = 'none';
        selectMunicipio.required = false;
        selectMunicipio.value = "";
    } else {
        divMunicipio.style.display = 'block';
        selectMunicipio.required = true;
    }
};

window.cargarMunicipios = async function() {
    const deptoSelect = document.getElementById('departamento');
    const muniSelect = document.getElementById('municipio');
    const depto = deptoSelect.value;

    if (document.getElementById('divMunicipio').style.display === 'none') return;

    muniSelect.innerHTML = '<option value="">Cargando...</option>';
    muniSelect.disabled = true;

    if (depto) {
        try {
            const res = await fetch(`/api/listas?tipo=municipio&padre=${depto}`);
            const datos = await res.json();
            muniSelect.innerHTML = '<option value="" disabled selected>Seleccione...</option>';
            datos.forEach(item => {
                const opt = document.createElement('option');
                opt.value = item.valor; opt.innerText = item.valor; muniSelect.appendChild(opt);
            });
            muniSelect.disabled = false;
        } catch (err) { muniSelect.innerHTML = '<option value="">Error</option>'; }
    }
};

document.getElementById('registroForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnGuardar');
    const textoOriginal = btn.innerText;
    btn.innerText = "Guardando..."; btn.disabled = true;

    const data = {
        institucion: document.getElementById('institucion').value,
        departamento: document.getElementById('departamento').value,
        municipio: document.getElementById('municipio').value, 
        nombre: document.getElementById('nombre').value,
        puesto: document.getElementById('puesto').value,
        unidad: document.getElementById('unidad').value,
        correo: document.getElementById('correo').value,
        celular: document.getElementById('celular').value,
    };

    try {
        const res = await fetch('/api/post-registro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (res.ok) {
            Swal.fire('¡Éxito!', 'Registro guardado.', 'success');
            document.getElementById('registroForm').reset();
            document.getElementById('municipio').disabled = true;
            document.getElementById('divMunicipio').style.display = 'block'; // Reset visual
            cargarDirectorioPublico(); // Recargar la tabla pública abajo
        } else { Swal.fire('Error', 'No se pudo guardar', 'error'); }
    } catch (err) { Swal.fire('Error', 'Error de conexión', 'error'); }
    
    btn.innerText = textoOriginal; btn.disabled = false;
});

// --- LÓGICA DIRECTORIO PÚBLICO Y SOLICITUD DE CORRECCIONES ---

async function cargarDirectorioPublico() {
    const contenedor = document.getElementById('contenedorDirectorio');
    try {
        const res = await fetch('/api/public-registros');
        const json = await res.json();
        const registros = json.data;

        if (!registros || registros.length === 0) {
            contenedor.innerHTML = '<p style="text-align:center;">No hay registros aún.</p>';
            return;
        }

        contenedor.innerHTML = '';
        const instituciones = [...new Set(registros.map(r => r.institucion))].sort();

        instituciones.forEach(inst => {
            const registrosInst = registros.filter(r => r.institucion === inst);
            const div = document.createElement('div');
            div.className = 'tabla-publica-container';
            
            div.innerHTML = `
                <div class="header-publico">${inst}</div>
                <div style="overflow-x: auto;">
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Puesto / Unidad</th>
                                <th>Ubicación</th>
                                <th>Contacto</th>
                                <th style="text-align:center;">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${registrosInst.map(r => `
                                <tr>
                                    <td><strong>${r.nombre_completo}</strong></td>
                                    <td>${r.puesto}<br><small style="color:#666">${r.unidad_direccion}</small></td>
                                    <td>${r.departamento}${r.municipio ? `<br><small>${r.municipio}</small>` : ''}</td>
                                    <td>${r.correo}<br>${r.celular}</td>
                                    <td style="text-align:center;">
                                        <button class="btn-solicitar" onclick='abrirModalCorreccion(${JSON.stringify(r)})'>
                                            ✏️ Corregir
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            contenedor.appendChild(div);
        });
    } catch (error) { console.error(error); contenedor.innerHTML = 'Error cargando directorio.'; }
}

window.abrirModalCorreccion = async function(registro) {
    const { value: formValues } = await Swal.fire({
        title: 'Solicitar Corrección',
        html: `
            <p style="font-size:0.9em; margin-bottom:15px; color:#666;">Edita los datos incorrectos y envía la solicitud.</p>
            <input id="swal-nombre" class="swal2-input" placeholder="Nombre" value="${registro.nombre_completo}">
            <input id="swal-puesto" class="swal2-input" placeholder="Puesto" value="${registro.puesto}">
            <input id="swal-unidad" class="swal2-input" placeholder="Unidad" value="${registro.unidad_direccion}">
            <input id="swal-correo" class="swal2-input" placeholder="Correo" value="${registro.correo}">
            <input id="swal-celular" class="swal2-input" placeholder="Celular" value="${registro.celular}">
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Enviar Solicitud',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            return {
                nombre: document.getElementById('swal-nombre').value,
                puesto: document.getElementById('swal-puesto').value,
                unidad: document.getElementById('swal-unidad').value,
                correo: document.getElementById('swal-correo').value,
                celular: document.getElementById('swal-celular').value,
                // Mantenemos los datos originales no editables
                institucion: registro.institucion,
                departamento: registro.departamento,
                municipio: registro.municipio
            }
        }
    });

    if (formValues) {
        try {
            const res = await fetch('/api/ediciones', {
                method: 'POST',
                // --- ¡AQUÍ ESTÁ LA CORRECCIÓN CLAVE! ---
                headers: { 'Content-Type': 'application/json' },
                // ---------------------------------------
                body: JSON.stringify({ registro_id: registro.id, nuevos_datos: formValues })
            });
            
            if(res.ok) {
                Swal.fire('Enviado', 'El administrador revisará tu corrección.', 'success');
            } else {
                const errorData = await res.json();
                console.error("Error servidor:", errorData);
                Swal.fire('Error', 'No se pudo enviar la solicitud.', 'error');
            }
        } catch(e) { 
            console.error(e);
            Swal.fire('Error', 'Fallo de conexión.', 'error'); 
        }
    }
};