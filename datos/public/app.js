document.addEventListener('DOMContentLoaded', async () => {
    cargarLista('institucion');
    cargarLista('departamento');
});

// Cargar listas iniciales
async function cargarLista(tipo) {
    try {
        const response = await fetch(`/api/listas?tipo=${tipo}`);
        const datos = await response.json();
        
        const select = document.getElementById(tipo);
        // Mantenemos el placeholder, borramos lo demás
        select.innerHTML = `<option value="" disabled selected>Seleccione...</option>`;

        datos.forEach(item => {
            const option = document.createElement('option');
            option.value = item.valor;
            option.textContent = item.valor;
            select.appendChild(option);
        });
    } catch (error) {
        console.error(`Error cargando ${tipo}:`, error);
    }
}

// Cargar municipios cuando cambia el departamento
async function cargarMunicipios() {
    const deptoSelect = document.getElementById('departamento');
    const muniSelect = document.getElementById('municipio');
    const deptoNombre = deptoSelect.value;

    if (!deptoNombre) return;

    muniSelect.disabled = false;
    muniSelect.innerHTML = `<option>Cargando...</option>`;

    try {
        const response = await fetch(`/api/listas?tipo=municipio&padre=${deptoNombre}`);
        const datos = await response.json();

        muniSelect.innerHTML = `<option value="" disabled selected>Seleccione...</option>`;
        
        datos.forEach(item => {
            const option = document.createElement('option');
            option.value = item.valor;
            option.textContent = item.valor;
            muniSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error cargando municipios:', error);
    }
}

// Enviar formulario (Sin cambios en tu lógica original de envío)
document.getElementById('registroForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const datos = {
        institucion: document.getElementById('institucion').value,
        departamento: document.getElementById('departamento').value,
        municipio: document.getElementById('municipio').value,
        nombre: document.getElementById('nombre').value,
        puesto: document.getElementById('puesto').value,
        unidad: document.getElementById('unidad').value,
        correo: document.getElementById('correo').value,
        celular: document.getElementById('celular').value
    };

    try {
        const res = await fetch('/api/post-registro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        if (res.ok) {
            Swal.fire({
                title: '¡Éxito!',
                text: 'Datos guardados correctamente',
                icon: 'success',
                confirmButtonText: 'Aceptar'
            }).then(() => {
                document.getElementById('registroForm').reset();
                // Reiniciar el select de municipios
                document.getElementById('municipio').innerHTML = '<option value="" disabled selected>Seleccione un departamento primero</option>';
                document.getElementById('municipio').disabled = true;
            });
        } else {
            throw new Error('Error en el servidor');
        }
    } catch (error) {
        Swal.fire('Error', 'Hubo un problema al guardar', 'error');
    }
});

// Hacemos global la función cargarMunicipios para que el HTML la vea
window.cargarMunicipios = cargarMunicipios;