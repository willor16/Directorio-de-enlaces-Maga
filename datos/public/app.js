document.addEventListener('DOMContentLoaded', async () => {
    // Cargas iniciales
    await cargarSelect('/api/listas?tipo=institucion', 'institucion');
    await cargarSelect('/api/listas?tipo=departamento', 'departamento');
    gestionarTerritorio();
    cargarDirectorioPublico();
});

// --- LÓGICA DEL FORMULARIO ---

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
    muniSelect.innerHTML = '<option value="">Cargando...</option>'; muniSelect.disabled = true;
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
        tipoEnlace: document.getElementById('tipoEnlace').value 
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
            document.getElementById('divMunicipio').style.display = 'block';
            cargarDirectorioPublico(); 
        } else { Swal.fire('Error', 'No se pudo guardar', 'error'); }
    } catch (err) { Swal.fire('Error', 'Error de conexión', 'error'); }
    btn.innerText = textoOriginal; btn.disabled = false;
});

// --- DIRECTORIO PÚBLICO (LISTA DESPLEGABLE Y DATOS LIMITADOS) ---

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
            
            // Usamos <details> para lista desplegable
            const details = document.createElement('details');
            details.className = 'lista-desplegable';
            
            // Header del acordeón con conteo
            details.innerHTML = `
                <summary>${inst} <span style="font-size:0.9em; opacity:0.9;">(${registrosInst.length})</span></summary>
                <div style="overflow-x: auto; background: #fff;">
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Unidad / Dirección</th>
                                <th>Tipo Enlace</th>
                                <th>Ubicación</th>
                                <th style="text-align:center;">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${registrosInst.map(r => `
                                <tr>
                                    <td><strong>${r.nombre_completo}</strong></td>
                                    <td>${r.unidad_direccion}</td>
                                    <td><span class="badge">${r.tipo_enlace || 'N/A'}</span></td>
                                    <td>${r.departamento}${r.municipio ? ', ' + r.municipio : ''}</td>
                                    <td style="text-align:center;">
                                        <button class="btn-actualizar" onclick='abrirModalActualizar(${JSON.stringify(r)})'>
                                            Actualizar
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            contenedor.appendChild(details);
        });
    } catch (error) { console.error(error); contenedor.innerHTML = 'Error cargando directorio.'; }
}

// --- MODAL DE ACTUALIZACIÓN CONFIDENCIAL ---
window.abrirModalActualizar = async function(registro) {
    // Inputs vacíos para confidencialidad
    const { value: formValues } = await Swal.fire({
        title: 'Actualizar Datos',
        html: `
            <p style="font-size:0.9em; margin-bottom:15px; color:#666;">
                Ingrese <b>SOLO</b> los datos que desea cambiar. Deje en blanco lo que está correcto.
            </p>
            <input id="swal-nombre" class="swal2-input" placeholder="Nuevo Nombre (Opcional)">
            <input id="swal-puesto" class="swal2-input" placeholder="Nuevo Puesto (Opcional)">
            <input id="swal-unidad" class="swal2-input" placeholder="Nueva Unidad (Opcional)">
            <input id="swal-correo" class="swal2-input" placeholder="Nuevo Correo (Opcional)">
            <input id="swal-celular" class="swal2-input" placeholder="Nuevo Celular (Opcional)">
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Enviar Actualización',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            // Si el input está vacío, usamos el valor original del registro
            const val = (id, original) => {
                const input = document.getElementById(id).value.trim();
                return input === "" ? original : input;
            };

            return {
                nombre: val('swal-nombre', registro.nombre_completo),
                puesto: val('swal-puesto', registro.puesto),
                unidad: val('swal-unidad', registro.unidad_direccion),
                correo: val('swal-correo', registro.correo),
                celular: val('swal-celular', registro.celular),
                // Datos base no editables
                institucion: registro.institucion,
                departamento: registro.departamento,
                municipio: registro.municipio,
                tipoEnlace: registro.tipo_enlace
            }
        }
    });

    if (formValues) {
        try {
            const res = await fetch('/api/ediciones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ registro_id: registro.id, nuevos_datos: formValues })
            });
            
            if(res.ok) Swal.fire('Enviado', 'La actualización será revisada.', 'success');
            else Swal.fire('Error', 'No se pudo enviar.', 'error');
        } catch(e) { Swal.fire('Error', 'Fallo de conexión.', 'error'); }
    }
};