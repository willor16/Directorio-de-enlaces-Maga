let passwordGuardada = "";
let todosLosRegistros = [];

// --- LOGIN ---
async function checkLogin() {
    const pass = document.getElementById('passwordInput').value;
    const res = await fetch('/api/get-registros', { headers: { 'x-admin-password': pass } });

    if (res.status === 200) {
        passwordGuardada = pass;
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        
        const json = await res.json();
        todosLosRegistros = json.data;
        cargarRegistrosPorInstitucion(todosLosRegistros);
        cargarConfiguraciones();
    } else { Swal.fire('Error', 'Contraseña incorrecta', 'error'); }
}

function cerrarSesion() {
    passwordGuardada = "";
    todosLosRegistros = [];
    window.location.href = "/";
}

// --- SIDEBAR DE SOLICITUDES ---
window.toggleSidebar = function() {
    const sb = document.getElementById('sidebarSolicitudes');
    if (sb.style.right === '0px') sb.style.right = '-400px';
    else {
        sb.style.right = '0px';
        cargarSolicitudesPendientes();
    }
}

async function cargarSolicitudesPendientes() {
    const contenedor = document.getElementById('listaSolicitudes');
    contenedor.innerHTML = '<p>Cargando...</p>';

    if(!passwordGuardada) return;

    try {
        const res = await fetch('/api/ediciones', { method: 'GET', headers: { 'x-admin-password': passwordGuardada } });
        const solicitudes = await res.json();

        if (solicitudes.length === 0) {
            contenedor.innerHTML = '<p style="color:#999;">No hay solicitudes pendientes.</p>';
            return;
        }

        contenedor.innerHTML = '';
        solicitudes.forEach(sol => {
            const nuevos = sol.nuevos_datos;
            const card = document.createElement('div');
            card.style.cssText = "background: #f9f9f9; border: 1px solid #eee; padding: 10px; margin-bottom: 10px; border-radius: 8px; font-size: 0.9em;";
            
            card.innerHTML = `
                <div style="font-weight:bold; margin-bottom:5px; color:#005696;">${nuevos.nombre}</div>
                <div style="margin-bottom:10px; font-size:0.85em;">
                    <strong>Cambios propuestos:</strong><br>
                    ${nuevos.puesto} - ${nuevos.unidad}<br>
                    ${nuevos.correo} <br> ${nuevos.celular}
                </div>
                <div style="display:flex; gap:5px;">
                    <button onclick='aprobarEdicion(${JSON.stringify(sol)})' style="flex:1; background:#28a745; color:white; border:none; padding:5px; border-radius:4px; cursor:pointer;">✔</button>
                    <button onclick="rechazarEdicion(${sol.solicitud_id})" style="flex:1; background:#dc3545; color:white; border:none; padding:5px; border-radius:4px; cursor:pointer;">✕</button>
                </div>
            `;
            contenedor.appendChild(card);
        });
    } catch (e) { contenedor.innerHTML = 'Error al cargar.'; }
}

async function aprobarEdicion(solicitud) {
    if(!confirm('¿Aprobar cambios?')) return;
    try {
        const res = await fetch('/api/ediciones', {
            method: 'PUT',
            headers: { 'x-admin-password': passwordGuardada, 'Content-Type': 'application/json' },
            body: JSON.stringify({ solicitud_id: solicitud.solicitud_id, registro_id: solicitud.id, datos_finales: solicitud.nuevos_datos })
        });
        if(res.ok) {
            Swal.fire('Aprobado', 'Registro actualizado.', 'success');
            cargarSolicitudesPendientes();
            checkLogin(); // Recargar tablas
        }
    } catch(e) { console.error(e); }
}

async function rechazarEdicion(id) {
    if(!confirm('¿Rechazar solicitud?')) return;
    try {
        await fetch(`/api/ediciones?solicitud_id=${id}`, { method: 'DELETE', headers: { 'x-admin-password': passwordGuardada } });
        cargarSolicitudesPendientes();
    } catch(e) { console.error(e); }
}

// --- GESTIÓN DE CONFIGURACIÓN ---
async function cargarConfiguraciones() {
    const res = await fetch('/api/listas'); const datos = await res.json();
    const listaInst = document.getElementById('listaInstituciones'); const listaDepto = document.getElementById('listaDepartamentos'); const listaMuni = document.getElementById('listaMunicipios'); const selectDepto = document.getElementById('selectDeptoParaMuni');
    listaInst.innerHTML = ''; listaDepto.innerHTML = ''; listaMuni.innerHTML = ''; selectDepto.innerHTML = '<option value="" disabled selected>Selecciona Depto...</option>';
    datos.forEach(item => {
        const btn = `<button onclick="borrarItem(${item.id})" style="color:red;border:none;background:none;cursor:pointer;font-weight:bold;">X</button>`;
        const li = document.createElement('li');
        if (item.categoria === 'institucion') { li.innerHTML = `<span>${item.valor}</span> ${btn}`; listaInst.appendChild(li); }
        else if (item.categoria === 'departamento') { li.innerHTML = `<span>${item.valor}</span> ${btn}`; listaDepto.appendChild(li); const opt = document.createElement('option'); opt.value = item.valor; opt.textContent = item.valor; selectDepto.appendChild(opt); }
        else if (item.categoria === 'municipio') { li.innerHTML = `<span>${item.valor} <small style='color:#777'>(${item.padre})</small></span> ${btn}`; listaMuni.appendChild(li); }
    });
}
async function agregarItem(categoria) {
    let valor = "", padre = null;
    if (categoria === 'institucion') valor = document.getElementById('inputInstitucion').value;
    if (categoria === 'departamento') valor = document.getElementById('inputDepartamento').value;
    if (categoria === 'municipio') { valor = document.getElementById('inputMunicipio').value; padre = document.getElementById('selectDeptoParaMuni').value; if (!padre) return Swal.fire('Alto', 'Selecciona departamento', 'warning'); }
    if (!valor) return;
    await fetch('/api/listas', { method: 'POST', headers: { 'x-admin-password': passwordGuardada }, body: JSON.stringify({ categoria, valor, padre }) });
    if(categoria === 'institucion') document.getElementById('inputInstitucion').value = '';
    if(categoria === 'departamento') document.getElementById('inputDepartamento').value = '';
    if(categoria === 'municipio') document.getElementById('inputMunicipio').value = '';
    cargarConfiguraciones();
}
async function borrarItem(id) { if (confirm('¿Eliminar?')) { await fetch(`/api/listas?id=${id}`, { method: 'DELETE', headers: { 'x-admin-password': passwordGuardada } }); cargarConfiguraciones(); } }
async function borrarRegistro(id) { if (confirm('¿Seguro?')) { await fetch(`/api/delete-registro?id=${id}`, { headers: { 'x-admin-password': passwordGuardada } }); checkLogin(); } }

// --- VISUALIZACIÓN ADMIN (ACORDEÓN + TABLA COMPLETA) ---
function cargarRegistrosPorInstitucion(registros) {
    const contenedor = document.getElementById('contenedorTablas'); 
    contenedor.innerHTML = '';
    const instituciones = [...new Set(registros.map(r => r.institucion))].sort();
    
    if (instituciones.length === 0) { 
        contenedor.innerHTML = '<p style="text-align:center;">No hay registros.</p>'; 
        return; 
    }

    instituciones.forEach(inst => {
        const registrosInst = registros.filter(r => r.institucion === inst);
        
        // Usamos details para el acordeón
        const details = document.createElement('details');
        details.className = 'lista-desplegable';
        
        // Header Admin: Título + Cantidad + Botón Excel
        details.innerHTML = `
            <summary style="outline:none;">
                <span>${inst} <span style="font-weight:normal; opacity:0.8;">(${registrosInst.length})</span></span>
                <button onclick="exportarExcelUnico('${inst}')" class="btn-excel" style="margin-left:auto;">📥 Excel</button>
            </summary>
            
            <div style="overflow-x: auto; background:#fff;">
                <table id="tabla-${inst.replace(/\s/g, '-')}" border="1">
                    <thead style="background: #f4f4f4;">
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Puesto</th>
                            <th>Unidad</th>
                            <th>Tipo Enlace</th>
                            <th>Ubicación</th>
                            <th>Contacto</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${registrosInst.map(r => `
                            <tr>
                                <td>${r.id}</td>
                                <td>${r.nombre_completo}</td>
                                <td>${r.puesto}</td>
                                <td>${r.unidad_direccion}</td>
                                <td style="color:#005696; font-weight:bold;">${r.tipo_enlace || '-'}</td>
                                <td>${r.departamento}${r.municipio ? ' - '+r.municipio : ''}</td>
                                <td>${r.correo}<br>${r.celular}</td>
                                <td style="text-align:center;">
                                    <button onclick="borrarRegistro(${r.id})" style="background:#dc3545;color:white;border:none;padding:5px 10px;border-radius:4px;cursor:pointer;">Borrar</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>`;
        contenedor.appendChild(details);
    });
}

function exportarExcelUnico(nombreInst) {
    const tabla = document.getElementById(`tabla-${nombreInst.replace(/\s/g, '-')}`);
    if (!tabla) return;
    const clon = tabla.cloneNode(true); limpiarUltimaColumna(clon);
    const wb = XLSX.utils.table_to_book(clon, { sheet: "Datos" });
    XLSX.writeFile(wb, `Reporte-${nombreInst}.xlsx`);
}

function exportarTodoGlobal() {
    if (todosLosRegistros.length === 0) return Swal.fire('Aviso', 'Sin datos', 'info');
    let datos = [];
    const headers = ["ID", "Nombre", "Puesto", "Unidad", "Tipo Enlace", "Departamento", "Municipio", "Correo", "Celular"];
    const instituciones = [...new Set(todosLosRegistros.map(r => r.institucion))].sort();
    
    instituciones.forEach(inst => {
        datos.push([`INSTITUCIÓN: ${inst.toUpperCase()}`]); datos.push(headers);
        todosLosRegistros.filter(r => r.institucion === inst).forEach(r => 
            datos.push([r.id, r.nombre_completo, r.puesto, r.unidad_direccion, r.tipo_enlace, r.departamento, r.municipio, r.correo, r.celular])
        );
        datos.push([]); datos.push([]);
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(datos), "Reporte Completo");
    XLSX.writeFile(wb, `Reporte-GLOBAL-${new Date().toISOString().slice(0,10)}.xlsx`);
}

function limpiarUltimaColumna(tabla) { for (let i = 0; i < tabla.rows.length; i++) { const row = tabla.rows[i]; if (row.cells.length > 0) row.deleteCell(row.cells.length - 1); } }