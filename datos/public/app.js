document.addEventListener('DOMContentLoaded', async () => {
    await cargarSelect('/api/listas?tipo=institucion', 'institucion');
    await cargarSelect('/api/listas?tipo=departamento', 'departamento');
    gestionarTerritorio();
    cargarDirectorioPublico();
});

async function cargarSelect(url, idElemento) {
    try {
        const res = await fetch(url);
        const datos = await res.json();
        const select = document.getElementById(idElemento);
        select.innerHTML = '<option value="" disabled selected>Seleccione...</option>';
        datos.forEach(item => {
            const opt = document.createElement('option');
            opt.value = item.valor; opt.innerText = item.valor; select.appendChild(opt);
        });
    } catch (error) { console.error(error); }
}

window.gestionarTerritorio = function() {
    const tipo = document.getElementById('tipoEnlace').value;
    const divMunicipio = document.getElementById('divMunicipio');
    const selectMunicipio = document.getElementById('municipio');
    if (tipo === 'departamental') {
        divMunicipio.style.display = 'none'; selectMunicipio.required = false; selectMunicipio.value = "";
    } else {
        divMunicipio.style.display = 'block'; selectMunicipio.required = true;
    }
};

window.cargarMunicipios = async function() {
    const depto = document.getElementById('departamento').value;
    const muniSelect = document.getElementById('municipio');
    if (document.getElementById('divMunicipio').style.display === 'none') return;
    muniSelect.innerHTML = '<option>Cargando...</option>'; muniSelect.disabled = true;
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
        } catch (err) { muniSelect.innerHTML = '<option>Error</option>'; }
    }
};

document.getElementById('registroForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnGuardar');
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
        const res = await fetch('/api/post-registro', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        if (res.ok) {
            Swal.fire('¡Éxito!', 'Registro guardado.', 'success');
            document.getElementById('registroForm').reset();
            document.getElementById('divMunicipio').style.display = 'block';
            cargarDirectorioPublico(); 
        } else { Swal.fire('Error', 'No se pudo guardar', 'error'); }
    } catch (err) { Swal.fire('Error', 'Error conexión', 'error'); }
    btn.innerText = "GUARDAR REGISTRO"; btn.disabled = false;
});

async function cargarDirectorioPublico() {
    const contenedor = document.getElementById('contenedorDirectorio');
    try {
        const res = await fetch('/api/public-registros');
        const json = await res.json();
        const registros = json.data;
        if (!registros || registros.length === 0) { contenedor.innerHTML = '<p style="text-align:center; color:#999;">No hay registros.</p>'; return; }

        contenedor.innerHTML = '';
        const instituciones = [...new Set(registros.map(r => r.institucion))].sort();

        instituciones.forEach(inst => {
            const registrosInst = registros.filter(r => r.institucion === inst);
            const details = document.createElement('details');
            details.className = 'lista-desplegable';
            details.innerHTML = `
                <summary><span>${inst}</span><span class="badge" style="background:rgba(255,255,255,0.2); color:white;">${registrosInst.length}</span></summary>
                <div class="tabla-responsive">
                    <table>
                        <thead>
                            <tr><th>Nombre</th><th>Unidad / Dirección</th><th>Tipo Enlace</th><th>Ubicación</th><th style="text-align:center;">Acción</th></tr>
                        </thead>
                        <tbody>
                            ${registrosInst.map(r => `
                                <tr>
                                    <td style="font-weight:600;">${r.nombre_completo}</td>
                                    <td>${r.unidad_direccion}</td>
                                    <td><span class="badge">${r.tipo_enlace || 'N/A'}</span></td>
                                    <td>${r.departamento}${r.municipio ? ', '+r.municipio : ''}</td>
                                    <td style="text-align:center;"><button class="btn-actualizar" onclick='abrirModalActualizar(${JSON.stringify(r)})'>Actualizar</button></td>
                                </tr>`).join('')}
                        </tbody>
                    </table>
                </div>`;
            contenedor.appendChild(details);
        });
    } catch (error) { console.error(error); }
}

window.abrirModalActualizar = async function(registro) {
    const { value: formValues } = await Swal.fire({
        title: 'Actualizar Datos',
        html: `
            <p style="font-size:0.9em; margin-bottom:15px; color:#666;">Modifique solo lo necesario.</p>
            <select id="swal-institucion" class="swal2-input"><option value="">Cargando...</option></select>
            <select id="swal-tipoEnlace" class="swal2-input"><option value="">(Sin cambio) Tipo Enlace</option><option value="departamental">Departamental</option><option value="municipal">Municipal</option></select>
            <div style="display:flex; gap:5px;"><select id="swal-departamento" class="swal2-input"><option value="">Cargando...</option></select><select id="swal-municipio" class="swal2-input" disabled><option value="">Muni...</option></select></div>
            <input id="swal-nombre" class="swal2-input" placeholder="Nuevo Nombre">
            <input id="swal-puesto" class="swal2-input" placeholder="Nuevo Puesto">
            <input id="swal-unidad" class="swal2-input" placeholder="Nueva Unidad">
            <input id="swal-correo" class="swal2-input" placeholder="Nuevo Correo">
            <input id="swal-celular" class="swal2-input" placeholder="Nuevo Celular">
        `,
        focusConfirm: false, showCancelButton: true, confirmButtonText: 'Enviar', cancelButtonText: 'Cancelar',
        didOpen: async () => {
            const resInst = await fetch('/api/listas?tipo=institucion'); const dataInst = await resInst.json();
            const selInst = document.getElementById('swal-institucion'); selInst.innerHTML = '<option value="">(Sin cambio) Institución</option>';
            dataInst.forEach(i => selInst.innerHTML += `<option value="${i.valor}">${i.valor}</option>`);

            const resDepto = await fetch('/api/listas?tipo=departamento'); const dataDepto = await resDepto.json();
            const selDepto = document.getElementById('swal-departamento'); selDepto.innerHTML = '<option value="">(Sin cambio) Depto</option>';
            dataDepto.forEach(d => selDepto.innerHTML += `<option value="${d.valor}">${d.valor}</option>`);

            selDepto.addEventListener('change', async () => {
                const selMuni = document.getElementById('swal-municipio'); selMuni.disabled = true; selMuni.innerHTML = '<option>Cargando...</option>';
                if(selDepto.value) {
                    const resMuni = await fetch(`/api/listas?tipo=municipio&padre=${selDepto.value}`);
                    const dataMuni = await resMuni.json();
                    selMuni.innerHTML = '<option value="">(Sin cambio)</option>';
                    dataMuni.forEach(m => selMuni.innerHTML += `<option value="${m.valor}">${m.valor}</option>`);
                    selMuni.disabled = false;
                }
            });
        },
        preConfirm: () => {
            const val = (id, orig) => { const v = document.getElementById(id).value.trim(); return v === "" ? orig : v; };
            return {
                institucion: val('swal-institucion', registro.institucion),
                tipoEnlace: val('swal-tipoEnlace', registro.tipo_enlace),
                departamento: val('swal-departamento', registro.departamento),
                municipio: val('swal-municipio', registro.municipio),
                nombre: val('swal-nombre', registro.nombre_completo),
                puesto: val('swal-puesto', registro.puesto),
                unidad: val('swal-unidad', registro.unidad_direccion),
                correo: val('swal-correo', registro.correo),
                celular: val('swal-celular', registro.celular)
            };
        }
    });

    if (formValues) {
        try {
            const res = await fetch('/api/ediciones', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ registro_id: registro.id, nuevos_datos: formValues }) });
            if(res.ok) Swal.fire('Enviado', 'Pendiente de aprobación.', 'success');
            else Swal.fire('Error', 'Falló el envío.', 'error');
        } catch(e) { Swal.fire('Error', 'Error conexión', 'error'); }
    }
};