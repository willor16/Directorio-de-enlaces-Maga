let registrosGlobal = [];

function checkLogin() {
    const pass = document.getElementById('passwordInput').value;
    if (pass === "admin2026") { // CAMBIA ESTO
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        cargarDatos();
    } else {
        Swal.fire('Error', 'Contraseña incorrecta', 'error');
    }
}

async function cargarDatos() {
    const res = await fetch('/api/get-registros');
    const json = await res.json();
    registrosGlobal = json.data;
    renderTabla();
}

function renderTabla() {
    const tbody = document.querySelector('#tablaRegistros tbody');
    tbody.innerHTML = '';
    registrosGlobal.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><b>${r.institucion}</b></td>
            <td>${r.municipio}, ${r.departamento}</td>
            <td>
                <div>${r.nombre_completo}</div>
                <div style="font-size: 0.8em; color: #666;">${r.puesto} - ${r.unidad_direccion}</div>
            </td>
            <td>${r.correo}<br><small>${r.celular}</small></td>
            <td class="actions">
                <button class="btn-edit" onclick="abrirEditar(${r.id})">✏️</button>
                <button class="btn-delete" onclick="borrar(${r.id})">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function abrirEditar(id) {
    const r = registrosGlobal.find(x => x.id === id);
    document.getElementById('editId').value = r.id;
    document.getElementById('editNombre').value = r.nombre_completo;
    document.getElementById('editPuesto').value = r.puesto;
    document.getElementById('editCorreo').value = r.correo;
    document.getElementById('editCelular').value = r.celular;
    document.getElementById('modalEdit').style.display = 'flex';
}

function cerrarModal() { document.getElementById('modalEdit').style.display = 'none'; }

async function guardarEdicion() {
    const id = document.getElementById('editId').value;
    // Solo editamos algunos campos en este ejemplo simplificado
    const rOriginal = registrosGlobal.find(x => x.id == id);
    
    const body = {
        id: id,
        ...rOriginal, // mantenemos datos viejos
        nombre: document.getElementById('editNombre').value,
        puesto: document.getElementById('editPuesto').value,
        correo: document.getElementById('editCorreo').value,
        celular: document.getElementById('editCelular').value,
    };

    await fetch('/api/update-registro', {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body)
    });
    
    cerrarModal();
    cargarDatos();
    Swal.fire('Actualizado', '', 'success');
}

async function borrar(id) {
    if (confirm('¿Seguro de borrar?')) {
        await fetch(`/api/delete-registro?id=${id}`);
        cargarDatos();
    }
}

function exportarExcel() {
    // Limpiamos los datos para que el Excel se vea bien
    const datosLimpios = registrosGlobal.map(r => ({
        Institucion: r.institucion,
        Departamento: r.departamento,
        Municipio: r.municipio,
        Nombre: r.nombre_completo,
        Puesto: r.puesto,
        Unidad: r.unidad_direccion,
        Correo: r.correo,
        Celular: r.celular
    }));

    const ws = XLSX.utils.json_to_sheet(datosLimpios);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Directorio");
    XLSX.writeFile(wb, "Mano_a_Mano_2026.xlsx");
}