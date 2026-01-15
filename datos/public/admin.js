let passwordGuardada = "";

// --- LOGIN ---
async function checkLogin() {
    const pass = document.getElementById('passwordInput').value;
    
    // Verificamos contraseña pidiendo los datos
    const res = await fetch('/api/get-registros', {
        headers: { 'x-admin-password': pass }
    });

    if (res.status === 200) {
        passwordGuardada = pass;
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        
        // Cargar todo
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

// --- GESTIÓN DE LISTAS (Instituciones, Deptos, Munis) ---
async function cargarConfiguraciones() {
    // Pedimos TODA la configuración de un solo golpe
    const res = await fetch('/api/listas');
    const datos = await res.json();

    const listaInst = document.getElementById('listaInstituciones');
    const listaDepto = document.getElementById('listaDepartamentos');
    const listaMuni = document.getElementById('listaMunicipios');
    const selectDepto = document.getElementById('selectDeptoParaMuni');

    // Limpiamos
    listaInst.innerHTML = '';
    listaDepto.innerHTML = '';
    listaMuni.innerHTML = '';
    
    // Guardamos selección actual del dropdown para no perderla al recargar
    const deptoSeleccionado = selectDepto.value;
    selectDepto.innerHTML = '<option value="" disabled selected>Selecciona Depto...</option>';

    datos.forEach(item => {
        const btnBorrar = `<button onclick="borrarItem(${item.id})" style="color:red; border:none; cursor:pointer;">X</button>`;
        const li = document.createElement('li');
        
        if (item.categoria === 'institucion') {
            li.innerHTML = `${item.valor} ${btnBorrar}`;
            listaInst.appendChild(li);

        } else if (item.categoria === 'departamento') {
            li.innerHTML = `${item.valor} ${btnBorrar}`;
            listaDepto.appendChild(li);
            
            // Agregar al dropdown de selección
            const opt = document.createElement('option');
            opt.value = item.valor;
            opt.textContent = item.valor;
            selectDepto.appendChild(opt);

        } else if (item.categoria === 'municipio') {
            li.innerHTML = `<small>(${item.padre})</small> <b>${item.valor}</b> ${btnBorrar}`;
            listaMuni.appendChild(li);
        }
    });

    // Restaurar selección del dropdown si existía
    if(deptoSeleccionado) selectDepto.value = deptoSeleccionado;
}

async function agregarItem(categoria) {
    let valor = "";
    let padre = null;

    if (categoria === 'institucion') valor = document.getElementById('inputInstitucion').value;
    if (categoria === 'departamento') valor = document.getElementById('inputDepartamento').value;
    if (categoria === 'municipio') {
        valor = document.getElementById('inputMunicipio').value;
        padre = document.getElementById('selectDeptoParaMuni').value;
        if (!padre) return Swal.fire('Alto', 'Debes seleccionar un departamento primero', 'warning');
    }

    if (!valor) return;

    await fetch('/api/listas', {
        method: 'POST',
        headers: { 'x-admin-password': passwordGuardada },
        body: JSON.stringify({ categoria, valor, padre })
    });

    // Limpiar inputs y recargar
    document.getElementById('inputInstitucion').value = '';
    document.getElementById('inputDepartamento').value = '';
    document.getElementById('inputMunicipio').value = '';
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

// --- GESTIÓN DE REGISTROS (La tabla grande) ---
function cargarRegistros(json) {
    const tbody = document.getElementById('tablaCuerpo');
    tbody.innerHTML = '';

    json.data.forEach(registro => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${registro.id}</td>
            <td>${registro.nombre_completo}</td>
            <td>${registro.puesto}</td>
            <td>${registro.unidad_direccion}</td>
            <td>${registro.departamento} - ${registro.municipio}</td>
            <td>${registro.correo}<br>${registro.celular}</td>
            <td>
                <button onclick="borrarRegistro(${registro.id})" style="background:#dc3545; color:white;">Borrar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function borrarRegistro(id) {
    if (confirm('¿Seguro de borrar este registro?')) {
        await fetch(`/api/delete-registro?id=${id}`, {
            headers: { 'x-admin-password': passwordGuardada }
        });
        // Recargar datos simulando login
        checkLogin(); 
    }
}