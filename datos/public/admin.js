let passwordGuardada = "";
let todosLosRegistros = [];

// --- LOGIN ---
async function checkLogin() {
    const pass = document.getElementById('passwordInput').value;
    const res = await fetch('/api/get-registros', { headers: { 'x-admin-password': pass } });
    
    if (res.status === 200) {
        passwordGuardada = pass;
        // Ocultar login, mostrar dashboard
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        document.getElementById('btnBell').style.display = 'block'; // Mostrar campanita
        
        const json = await res.json();
        todosLosRegistros = json.data;
        
        // Cargar datos
        cargarRegistrosPorInstitucion(todosLosRegistros);
        cargarConfiguraciones();
        verificarNotificaciones();
    } else {
        Swal.fire('Error', 'Contraseña incorrecta', 'error');
    }
}

function cerrarSesion() {
    passwordGuardada = "";
    todosLosRegistros = [];
    window.location.href = "/";
}

// --- NOTIFICACIONES Y SOLICITUDES ---
async function verificarNotificaciones() {
    try {
        const res = await fetch('/api/ediciones', { method: 'GET', headers: { 'x-admin-password': passwordGuardada } });
        const solicitudes = await res.json();
        const btnBell = document.getElementById('btnBell');
        
        if (solicitudes.length > 0) {
            btnBell.classList.add('notificacion-activa');
        } else {
            btnBell.classList.remove('notificacion-activa');
        }
    } catch (e) { console.error(e); }
}

// Función global para el botón de la campanita
window.toggleSidebar = function() {
    const sb = document.getElementById('sidebarSolicitudes');
    if (sb.style.right === '0px') {
        sb.style.right = '-400px';
    } else {
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
        
        // Actualizar estado campanita
        const btnBell = document.getElementById('btnBell');
        if (solicitudes.length > 0) btnBell.classList.add('notificacion-activa');
        else btnBell.classList.remove('notificacion-activa');

        if (solicitudes.length === 0) {
            contenedor.innerHTML = '<p style="color:#999;">No hay solicitudes pendientes.</p>';
            return;
        }

        contenedor.innerHTML = '';
        solicitudes.forEach(sol => {
            const nuevos = sol.nuevos_datos;
            const original = sol; // En una versión avanzada, podrías comparar con el registro original

            // Detectar cambios clave para mostrar resumen
            const cambioInst = nuevos.institucion !== original.institucion ? `Inst: <b>${nuevos.institucion}</b><br>` : '';
            const cambioUbi = (nuevos.departamento !== original.departamento || nuevos.municipio !== original.municipio) ? `Ubi: <b>${nuevos.departamento}-${nuevos.municipio}</b><br>` : '';

            const card = document.createElement('div');
            card.style.cssText = "background: #f9f9f9; border: 1px solid #eee; padding: 10px; margin-bottom: 10px; border-radius: 8px; font-size: 0.9em;";
            
            card.innerHTML = `
                <div style="font-weight:bold; color:#005696;">${nuevos.nombre}</div>
                <div style="font-size:0.85em; margin-bottom:5px;">
                    ${cambioInst}
                    ${cambioUbi}
                    Tipo: <b>${nuevos.tipoEnlace||'N/A'}</b><br>
                    ${nuevos.puesto} - ${nuevos.unidad}<br>
                    ${nuevos.correo}<br>
                    ${nuevos.celular}
                </div>
                <div style="display:flex; gap:5px;">
                    <button onclick='aprobarEdicion(${JSON.stringify(sol)})' style="flex:1; background:#28a745; color:white; border:none; padding:5px; border-radius:4px; cursor:pointer;">✔ Aprobar</button>
                    <button onclick="rechazarEdicion(${sol.solicitud_id})" style="flex:1; background:#dc3545; color:white; border:none; padding:5px; border-radius:4px; cursor:pointer;">✕ Rechazar</button>
                </div>
            `;
            contenedor.appendChild(card);
        });
    } catch (e) {
        contenedor.innerHTML = 'Error cargando solicitudes.';
    }
}

async function aprobarEdicion(solicitud) {
    if(!confirm('¿Estás seguro de aprobar estos cambios?')) return;

    try {
        const res = await fetch('/api/ediciones', {
            method: 'PUT',
            headers: { 
                'x-admin-password': passwordGuardada,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                solicitud_id: solicitud.solicitud_id,
                registro_id: solicitud.id, // El ID del registro original
                datos_finales: solicitud.nuevos_datos
            })
        });

        if(res.ok) {
            Swal.fire('Aprobado', 'El registro ha sido actualizado.', 'success');
            cargarSolicitudesPendientes(); // Recargar lista lateral
            checkLogin(); // Recargar tabla principal
        } else {
            Swal.fire('Error', 'No se pudo actualizar.', 'error');
        }
    } catch(e) {
        console.error(e);
        Swal.fire('Error', 'Error de conexión', 'error');
    }
}

async function rechazarEdicion(id) {
    if(!confirm('¿Rechazar y eliminar esta solicitud?')) return;
    
    await fetch(`/api/ediciones?solicitud_id=${id}`, { 
        method: 'DELETE', 
        headers: { 'x-admin-password': passwordGuardada } 
    });
    
    cargarSolicitudesPendientes();
}

// --- EXCEL SEPARADO (ESTO SE MANTIENE IGUAL: Columnas Originales) ---
function exportarExcelUnico(inst) {
    // Encabezados originales para Excel
    const data = [["ID", "Nombre", "Puesto", "Unidad", "Tipo Enlace", "Departamento", "Municipio", "Correo", "Celular"]];
    
    todosLosRegistros.filter(r => r.institucion === inst).forEach(r => {
        data.push([
            r.id, 
            r.nombre_completo, 
            r.puesto, 
            r.unidad_direccion, 
            r.tipo_enlace || '', 
            r.departamento || '', 
            r.municipio || '', 
            r.correo || '', 
            r.celular || ''
        ]);
    });
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Datos");
    XLSX.writeFile(wb, `Reporte-${inst}.xlsx`);
}

function exportarTodoGlobal() {
    if (todosLosRegistros.length === 0) return Swal.fire('Aviso', 'No hay datos para exportar', 'info');
    
    let datos = [];
    const headers = ["ID", "Nombre", "Puesto", "Unidad", "Tipo Enlace", "Departamento", "Municipio", "Correo", "Celular"];
    
    const instituciones = [...new Set(todosLosRegistros.map(r => r.institucion))].sort();
    
    instituciones.forEach(inst => {
        datos.push([`INSTITUCIÓN: ${inst.toUpperCase()}`]);
        datos.push(headers);
        
        const registrosInst = todosLosRegistros.filter(r => r.institucion === inst);
        registrosInst.forEach(r => {
            datos.push([
                r.id, 
                r.nombre_completo, 
                r.puesto, 
                r.unidad_direccion, 
                r.tipo_enlace,
                r.departamento, 
                r.municipio, 
                r.correo, 
                r.celular
            ]);
        });
        
        datos.push([]); // Espacio vacío
        datos.push([]);
    });
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(datos);
    XLSX.utils.book_append_sheet(wb, ws, "Reporte Completo");
    XLSX.writeFile(wb, `Reporte-GLOBAL-${new Date().toISOString().slice(0,10)}.xlsx`);
}

// --- GESTIÓN DE LISTAS (INSTITUCIONES, DEPTOS, MUNIS) ---
async function cargarConfiguraciones() {
    const res = await fetch('/api/listas');
    const datos = await res.json();
    
    const listaInst = document.getElementById('listaInstituciones');
    const listaDepto = document.getElementById('listaDepartamentos');
    const listaMuni = document.getElementById('listaMunicipios');
    const selectDepto = document.getElementById('selectDeptoParaMuni');
    
    listaInst.innerHTML = '';
    listaDepto.innerHTML = '';
    listaMuni.innerHTML = '';
    selectDepto.innerHTML = '<option value="" disabled selected>Selecciona Depto...</option>';
    
    datos.forEach(item => {
        const btn = `<button onclick="borrarItem(${item.id})" style="color:red;border:none;background:none;cursor:pointer;font-weight:bold;float:right;">X</button>`;
        const li = document.createElement('li');
        
        if (item.categoria === 'institucion') {
            li.innerHTML = `<span>${item.valor}</span> ${btn}`;
            listaInst.appendChild(li);
        } else if (item.categoria === 'departamento') {
            li.innerHTML = `<span>${item.valor}</span> ${btn}`;
            listaDepto.appendChild(li);
            // Llenar select
            const opt = document.createElement('option');
            opt.value = item.valor;
            opt.textContent = item.valor;
            selectDepto.appendChild(opt);
        } else if (item.categoria === 'municipio') {
            li.innerHTML = `<span>${item.valor} <small style='color:#777'>(${item.padre})</small></span> ${btn}`;
            listaMuni.appendChild(li);
        }
    });
}

async function agregarItem(categoria) {
    let valor = "";
    let padre = null;
    
    if (categoria === 'institucion') valor = document.getElementById('inputInstitucion').value;
    if (categoria === 'departamento') valor = document.getElementById('inputDepartamento').value;
    if (categoria === 'municipio') {
        valor = document.getElementById('inputMunicipio').value;
        padre = document.getElementById('selectDeptoParaMuni').value;
        if (!padre) return Swal.fire('Alto', 'Selecciona a qué departamento pertenece', 'warning');
    }
    
    if (!valor) return;
    
    await fetch('/api/listas', {
        method: 'POST',
        headers: { 'x-admin-password': passwordGuardada },
        body: JSON.stringify({ categoria, valor, padre })
    });
    
    // Limpiar inputs
    if(categoria === 'institucion') document.getElementById('inputInstitucion').value = '';
    if(categoria === 'departamento') document.getElementById('inputDepartamento').value = '';
    if(categoria === 'municipio') document.getElementById('inputMunicipio').value = '';
    
    cargarConfiguraciones();
}

async function borrarItem(id) {
    if (confirm('¿Eliminar este elemento de la lista?')) {
        await fetch(`/api/listas?id=${id}`, { 
            method: 'DELETE',
            headers: { 'x-admin-password': passwordGuardada }
        });
        cargarConfiguraciones();
    }
}

async function borrarRegistro(id) {
    if (confirm('¿Seguro que deseas borrar este registro permanentemente?')) {
        await fetch(`/api/delete-registro?id=${id}`, {
            headers: { 'x-admin-password': passwordGuardada }
        });
        checkLogin(); // Recargar tabla
    }
}

// --- CARGA DE TABLAS VISUALES (MODIFICADO: FUSIÓN DE COLUMNAS) ---
function cargarRegistrosPorInstitucion(registros) {
    const contenedor = document.getElementById('contenedorTablas');
    contenedor.innerHTML = '';
    
    const instituciones = [...new Set(registros.map(r => r.institucion))].sort();
    
    if (instituciones.length === 0) {
        contenedor.innerHTML = '<p style="text-align:center;">No hay registros aún.</p>';
        return;
    }

    instituciones.forEach(inst => {
        const registrosInst = registros.filter(r => r.institucion === inst);
        
        const details = document.createElement('details');
        details.className = 'lista-desplegable';
        
        details.innerHTML = `
            <summary>
                <span>${inst} <span style="font-weight:normal; opacity:0.8;">(${registrosInst.length})</span></span>
                <button onclick="exportarExcelUnico('${inst}')" class="btn-excel" style="margin-left:auto;">📥 Excel</button>
            </summary>
            
            <div class="tabla-responsive">
                <table id="tabla-${inst.replace(/\s/g, '-')}" border="1">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Puesto</th>
                            
                            <th>Unidad y Ubicación</th>
                            
                            <th>Tipo Enlace</th>
                            
                            <th>Correo</th>
                            <th>Celular</th>
                            
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                    ${registrosInst.map(r => `
                        <tr>
                            <td>${r.id}</td>
                            <td style="font-weight:600; color:#333;">${r.nombre_completo}</td>
                            <td>${r.puesto}</td>
                            
                            <td>
                                <div style="font-weight:bold; color:#005696;">${r.unidad_direccion}</div>
                                <div style="font-size:0.85em; color:#666; margin-top:4px;">
                                    📍 ${r.departamento}${r.municipio ? ' - '+r.municipio : ''}
                                </div>
                            </td>
                            
                            <td><span class="badge">${r.tipo_enlace || '-'}</span></td>
                            
                            <td>${r.correo}</td>
                            <td>${r.celular}</td>
                            
                            <td style="text-align:center;">
                                <button onclick="borrarRegistro(${r.id})" style="background:#dc3545; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:0.8em;">Borrar</button>
                            </td>
                        </tr>
                    `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        contenedor.appendChild(details);
    });
}