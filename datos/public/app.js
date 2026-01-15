// 1. CARGA INICIAL DESDE API (Reemplaza al objeto 'lugares')
document.addEventListener('DOMContentLoaded', async () => {
    await cargarSelect('/api/listas?tipo=institucion', 'institucion');
    await cargarSelect('/api/listas?tipo=departamento', 'departamento');
});

// Función auxiliar para llenar los selects sin borrar tu estilo
async function cargarSelect(url, idElemento) {
    try {
        const res = await fetch(url);
        const datos = await res.json();
        const select = document.getElementById(idElemento);
        
        // Limpiamos dejando solo la opción por defecto
        select.innerHTML = '<option value="" disabled selected>Seleccione...</option>';
        
        datos.forEach(item => {
            const opt = document.createElement('option');
            opt.value = item.valor;
            opt.innerText = item.valor;
            select.appendChild(opt);
        });
    } catch (error) {
        console.error("Error cargando lista:", error);
    }
}

// 2. CARGA DE MUNICIPIOS (Global para que el HTML la vea)
window.cargarMunicipios = async function() {
    const deptoSelect = document.getElementById('departamento');
    const muniSelect = document.getElementById('municipio');
    const depto = deptoSelect.value;

    muniSelect.innerHTML = '<option value="">Cargando...</option>';
    muniSelect.disabled = true;

    if (depto) {
        try {
            const res = await fetch(`/api/listas?tipo=municipio&padre=${depto}`);
            const datos = await res.json();

            muniSelect.innerHTML = '<option value="" disabled selected>Seleccione...</option>';
            
            datos.forEach(item => {
                const opt = document.createElement('option');
                opt.value = item.valor;
                opt.innerText = item.valor;
                muniSelect.appendChild(opt);
            });
            muniSelect.disabled = false;
        } catch (err) {
            console.error(err);
            muniSelect.innerHTML = '<option value="">Error al cargar</option>';
        }
    }
};

// 3. TU LÓGICA DE ENVÍO ORIGINAL
document.getElementById('registroForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnGuardar');
    const textoOriginal = btn.innerText;
    
    btn.innerText = "Guardando..."; 
    btn.disabled = true;

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
            document.getElementById('municipio').disabled = true;
        } else {
            Swal.fire('Error', 'No se pudo guardar', 'error');
        }
    } catch (err) {
        console.error(err);
        Swal.fire('Error', 'Error de conexión', 'error');
    }
    
    btn.innerText = textoOriginal; 
    btn.disabled = false;
});