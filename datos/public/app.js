const lugares = {
    "Sololá": ["Sololá", "Concepción", "Nahualá", "Panajachel"],
    "Quetzaltenango": ["Quetzaltenango", "Salcajá", "Olintepeque"],
    "Totonicapán": ["Totonicapán", "San Cristóbal"]
    // Agrega tus 15 departamentos aquí
};

// Cargar departamentos al inicio
const deptoSelect = document.getElementById('departamento');
Object.keys(lugares).forEach(d => {
    const opt = document.createElement('option');
    opt.value = d; opt.innerText = d;
    deptoSelect.appendChild(opt);
});

function cargarMunicipios() {
    const muniSelect = document.getElementById('municipio');
    const depto = deptoSelect.value;
    muniSelect.innerHTML = '<option value="">Seleccione...</option>';
    
    if (depto && lugares[depto]) {
        muniSelect.disabled = false;
        lugares[depto].forEach(m => {
            const opt = document.createElement('option');
            opt.value = m; opt.innerText = m;
            muniSelect.appendChild(opt);
        });
    } else {
        muniSelect.disabled = true;
    }
}

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
    };

    try {
        const res = await fetch('/api/post-registro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (res.ok) {
            Swal.fire('¡Éxito!', 'Registro guardado correctamente', 'success');
            document.getElementById('registroForm').reset();
        } else {
            Swal.fire('Error', 'No se pudo guardar', 'error');
        }
    } catch (err) {
        console.error(err);
        Swal.fire('Error', 'Error de conexión', 'error');
    }
    btn.innerText = "GUARDAR REGISTRO"; btn.disabled = false;
});