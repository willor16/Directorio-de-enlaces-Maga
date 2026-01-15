let passwordGuardada = "";

// --- LOGIN ---
async function checkLogin() {
    const pass = document.getElementById('passwordInput').value;
    const res = await fetch('/api/get-registros', { headers: { 'x-admin-password': pass } });

    if (res.status === 200) {
        passwordGuardada = pass;
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        cargarRegistros(await res.json());
        cargarConfiguraciones();
    } else {
        Swal.fire('Error', 'Contraseña incorrecta', 'error');
    }
}

function cerrarSesion() {
    passwordGuardada = "";
    window.location.href = "/";
}

// --- GESTIÓN DE CONFIGURACIÓN ---
async function cargarConfiguraciones() {
    const res = await fetch('/api/listas');
    const datos = await res.json();

    const listaInst = document.getElementById('listaInstituciones');
    const listaDepto = document.getElementById('listaDepartamentos');
    const listaMuni = document.getElementById('listaMunicipios');
    const selectDepto = document.getElementById('selectDeptoParaMuni');

    listaInst.innerHTML = ''; listaDepto.innerHTML = ''; listaMuni.innerHTML = '';
    
    // Guardar selección del dropdown
    const deptoVal = selectDepto.value;
    selectDepto.innerHTML = '<option value="" disabled selected>Selecciona Depto...</option>';

    datos.forEach(item => {
        const btn = `<button onclick="borrarItem(${item.id})" style="color:red;border:none;background:none;cursor:pointer;font-weight:bold;">X</button>`;
        const li = document.createElement('li');
        
        if (item.categoria === 'institucion') {
            li.innerHTML = `<span>${item.valor}</span> ${btn}`;
            listaInst.appendChild(li);
        } else if (item.categoria === 'departamento') {
            li.innerHTML = `<span>${item.valor}</span> ${btn}`;
            listaDepto.appendChild(li);
            // Llenar dropdown
            const opt = document.createElement('option');
            opt.value = item.valor; opt.textContent = item.valor;
            selectDepto.appendChild(opt);
        } else if (item.categoria === 'municipio') {
            li.innerHTML = `<span>${item.valor} <small style='color:#777'>(${item.padre})</small></span> ${btn}`;
            listaMuni.appendChild(li);
        }
    });
    if(deptoVal) selectDepto.value = deptoVal;
}

async function agregarItem(categoria) {
    let valor = "";
    let padre = null;

    if (categoria === 'institucion') valor = document.getElementById('inputInstitucion').value;
    if (categoria === 'departamento') valor = document.getElementById('inputDepartamento').value;
    if (categoria === 'municipio') {
        valor = document.getElementById('inputMunicipio').value;
        padre = document.getElementById('selectDeptoParaMuni').value;
        if (!padre) return Swal.fire('Alto', 'Selecciona un departamento', 'warning');
    }

    if (!valor) return;

    await fetch('/api/listas', {
        method: 'POST',
        headers: { 'x-admin-password': passwordGuardada },
        body: JSON.stringify({ categoria, valor, padre })
    });

    if(categoria === 'institucion') document.getElementById('inputInstitucion').value = '';
    if(categoria === 'departamento') document.getElementById('inputDepartamento').value = '';
    if(categoria === 'municipio') document.getElementById('inputMunicipio').value = '';
    cargarConfiguraciones();
}

async function borrarItem(id) {
    if (confirm('¿Eliminar?')) {
        await fetch(`/api/listas?id=${id}`, { method: 'DELETE', headers: { 'x-admin-password': passwordGuardada } });
        cargarConfiguraciones();
    }
}

// --- TABLA Y EXCEL ---
function cargarRegistros(json) {
    const tbody = document.getElementById('tablaCuerpo');
    tbody.innerHTML = '';
    json.data.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${r.id}</td>
            <td>${r.nombre_completo}</td>
            <td>${r.puesto}</td>
            <td>${r.unidad_direccion}</td>
            <td>${r.departamento} - ${r.municipio}</td>
            <td>${r.correo}<br>${r.celular}</td>
            <td><button onclick="borrarRegistro(${r.id})" style="background:#dc3545;color:white;border:none;padding:5px;border-radius:4px;cursor:pointer;">Borrar</button></td>
        `;
        tbody.appendChild(tr);
    });
}

async function borrarRegistro(id) {
    if (confirm('¿Seguro?')) {
        await fetch(`/api/delete-registro?id=${id}`, { headers: { 'x-admin-password': passwordGuardada } });
        checkLogin();
    }
}

// --- FUNCIÓN EXPORTAR A EXCEL ---
function exportarExcel() {
    let downloadLink;
    const dataType = 'application/vnd.ms-excel';
    const tableSelect = document.getElementById('tablaRegistros');
    const tableHTML = tableSelect.outerHTML.replace(/ /g, '%20');
    
    // Crear nombre del archivo con fecha
    const fecha = new Date().toISOString().slice(0,10);
    const filename = `Reporte-ManoAMano-${fecha}.xls`;
    
    downloadLink = document.createElement("a");
    document.body.appendChild(downloadLink);
    
    if (navigator.msSaveOrOpenBlob) {
        const blob = new Blob(['\ufeff', tableHTML], { type: dataType });
        navigator.msSaveOrOpenBlob(blob, filename);
    } else {
        downloadLink.href = 'data:' + dataType + ', ' + tableHTML;
        downloadLink.download = filename;
        downloadLink.click();
    }
}