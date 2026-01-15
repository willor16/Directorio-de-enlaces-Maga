let passwordGuardada = "";
let todosLosRegistros = []; // Guardaremos los datos aquí para usarlos al exportar

// --- LOGIN ---
async function checkLogin() {
    const pass = document.getElementById('passwordInput').value;
    const res = await fetch('/api/get-registros', { headers: { 'x-admin-password': pass } });

    if (res.status === 200) {
        passwordGuardada = pass;
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        
        const json = await res.json();
        todosLosRegistros = json.data; // Guardamos en variable global
        
        cargarRegistrosPorInstitucion(todosLosRegistros); // Nueva función de carga
        cargarConfiguraciones();
    } else {
        Swal.fire('Error', 'Contraseña incorrecta', 'error');
    }
}

function cerrarSesion() {
    passwordGuardada = "";
    todosLosRegistros = [];
    window.location.href = "/";
}

// --- GESTIÓN DE CONFIGURACIÓN (Sin cambios) ---
async function cargarConfiguraciones() {
    const res = await fetch('/api/listas');
    const datos = await res.json();
    const listaInst = document.getElementById('listaInstituciones');
    const listaDepto = document.getElementById('listaDepartamentos');
    const listaMuni = document.getElementById('listaMunicipios');
    const selectDepto = document.getElementById('selectDeptoParaMuni');
    listaInst.innerHTML = ''; listaDepto.innerHTML = ''; listaMuni.innerHTML = '';
    const deptoVal = selectDepto.value;
    selectDepto.innerHTML = '<option value="" disabled selected>Selecciona Depto...</option>';
    datos.forEach(item => {
        const btn = `<button onclick="borrarItem(${item.id})" style="color:red;border:none;background:none;cursor:pointer;font-weight:bold;">X</button>`;
        const li = document.createElement('li');
        if (item.categoria === 'institucion') {
            li.innerHTML = `<span>${item.valor}</span> ${btn}`; listaInst.appendChild(li);
        } else if (item.categoria === 'departamento') {
            li.innerHTML = `<span>${item.valor}</span> ${btn}`; listaDepto.appendChild(li);
            const opt = document.createElement('option'); opt.value = item.valor; opt.textContent = item.valor; selectDepto.appendChild(opt);
        } else if (item.categoria === 'municipio') {
            li.innerHTML = `<span>${item.valor} <small style='color:#777'>(${item.padre})</small></span> ${btn}`; listaMuni.appendChild(li);
        }
    });
    if(deptoVal) selectDepto.value = deptoVal;
}
async function agregarItem(categoria) {
    let valor = "", padre = null;
    if (categoria === 'institucion') valor = document.getElementById('inputInstitucion').value;
    if (categoria === 'departamento') valor = document.getElementById('inputDepartamento').value;
    if (categoria === 'municipio') { valor = document.getElementById('inputMunicipio').value; padre = document.getElementById('selectDeptoParaMuni').value; if (!padre) return Swal.fire('Alto', 'Selecciona un departamento', 'warning'); }
    if (!valor) return;
    await fetch('/api/listas', { method: 'POST', headers: { 'x-admin-password': passwordGuardada }, body: JSON.stringify({ categoria, valor, padre }) });
    if(categoria === 'institucion') document.getElementById('inputInstitucion').value = '';
    if(categoria === 'departamento') document.getElementById('inputDepartamento').value = '';
    if(categoria === 'municipio') document.getElementById('inputMunicipio').value = '';
    cargarConfiguraciones();
}
async function borrarItem(id) {
    if (confirm('¿Eliminar?')) { await fetch(`/api/listas?id=${id}`, { method: 'DELETE', headers: { 'x-admin-password': passwordGuardada } }); cargarConfiguraciones(); }
}
async function borrarRegistro(id) {
    if (confirm('¿Seguro?')) { await fetch(`/api/delete-registro?id=${id}`, { headers: { 'x-admin-password': passwordGuardada } }); checkLogin(); }
}

// =========================================================
// NUEVA LÓGICA: TABLAS SEPARADAS Y EXCEL SEGMENTADO
// =========================================================

function cargarRegistrosPorInstitucion(registros) {
    const contenedor = document.getElementById('contenedorTablas');
    contenedor.innerHTML = ''; // Limpiar todo

    // 1. Obtener lista única de instituciones presentes en los registros
    //    (Usamos Set para quitar duplicados)
    const instituciones = [...new Set(registros.map(r => r.institucion))].sort();

    if (instituciones.length === 0) {
        contenedor.innerHTML = '<p style="text-align:center;">No hay registros guardados aún.</p>';
        return;
    }

    // 2. Crear una tabla por cada institución
    instituciones.forEach(inst => {
        // Filtramos solo los registros de ESTA institución
        const registrosInst = registros.filter(r => r.institucion === inst);

        // Creamos la estructura HTML
        const div = document.createElement('div');
        div.className = 'tabla-institucion-container';

        // Encabezado con Título y Botón Individual
        div.innerHTML = `
            <div class="header-institucion">
                <h3 class="titulo-inst">${inst}</h3>
                <button onclick="exportarExcelUnico('${inst}')" class="btn-excel">
                    📥 Descargar Excel ${inst}
                </button>
            </div>
            
            <div style="overflow-x: auto;">
                <table id="tabla-${inst.replace(/\s/g, '-')}" border="1" style="width: 100%; border-collapse: collapse;">
                    <thead style="background: #f4f4f4;">
                        <tr>
                            <th style="padding:10px;">ID</th>
                            <th style="padding:10px;">Nombre</th>
                            <th style="padding:10px;">Puesto</th>
                            <th style="padding:10px;">Unidad</th>
                            <th style="padding:10px;">Ubicación</th>
                            <th style="padding:10px;">Contacto</th>
                            <th style="padding:10px;">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${registrosInst.map(r => `
                            <tr>
                                <td style="padding:8px;">${r.id}</td>
                                <td style="padding:8px;">${r.nombre_completo}</td>
                                <td style="padding:8px;">${r.puesto}</td>
                                <td style="padding:8px;">${r.unidad_direccion}</td>
                                <td style="padding:8px;">${r.departamento} - ${r.municipio}</td>
                                <td style="padding:8px;">${r.correo}<br>${r.celular}</td>
                                <td style="padding:8px; text-align:center;">
                                    <button onclick="borrarRegistro(${r.id})" style="background:#dc3545;color:white;border:none;padding:5px 10px;border-radius:4px;cursor:pointer;">Borrar</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        contenedor.appendChild(div);
    });
}

// --- EXPORTAR SOLO UNA INSTITUCIÓN ---
function exportarExcelUnico(nombreInst) {
    // Buscamos la tabla específica por ID
    const tablaId = `tabla-${nombreInst.replace(/\s/g, '-')}`;
    const tablaOriginal = document.getElementById(tablaId);
    
    if (!tablaOriginal) return;

    // Clonamos para limpiar la columna de borrar
    const tablaClonada = tablaOriginal.cloneNode(true);
    limpiarUltimaColumna(tablaClonada);

    const wb = XLSX.utils.table_to_book(tablaClonada, { sheet: "Datos" });
    const fecha = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Reporte-${nombreInst}-${fecha}.xlsx`);
}

// --- EXPORTAR TODO (SEGMENTADO EN UN SOLO ARCHIVO) ---
function exportarTodoGlobal() {
    if (todosLosRegistros.length === 0) return Swal.fire('Aviso', 'No hay datos para exportar', 'info');

    // Estructura manual para SheetJS (Array de Arrays)
    // Esto nos permite controlar filas vacías y títulos
    let datosExcel = [];
    
    const instituciones = [...new Set(todosLosRegistros.map(r => r.institucion))].sort();
    
    // Encabezados de columnas
    const headers = ["ID", "Nombre", "Puesto", "Unidad/Dirección", "Departamento", "Municipio", "Correo", "Celular"];

    instituciones.forEach(inst => {
        // TÍTULO DE SECCIÓN
        datosExcel.push([`INSTITUCIÓN: ${inst.toUpperCase()}`]); 
        
        // ENCABEZADOS
        datosExcel.push(headers);

        // DATOS DE ESA INSTITUCIÓN
        const registrosInst = todosLosRegistros.filter(r => r.institucion === inst);
        registrosInst.forEach(r => {
            datosExcel.push([
                r.id,
                r.nombre_completo,
                r.puesto,
                r.unidad_direccion,
                r.departamento,
                r.municipio,
                r.correo,
                r.celular
            ]);
        });

        // FILAS VACÍAS PARA SEPARAR VISUALMENTE
        datosExcel.push([]); 
        datosExcel.push([]); 
    });

    // Crear hoja desde el array
    const ws = XLSX.utils.aoa_to_sheet(datosExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte Completo");

    const fecha = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Reporte-GLOBAL-${fecha}.xlsx`);
}

// Helper para limpiar botones antes de exportar
function limpiarUltimaColumna(tabla) {
    for (let i = 0; i < tabla.rows.length; i++) {
        const row = tabla.rows[i];
        if (row.cells.length > 0) row.deleteCell(row.cells.length - 1);
    }
}