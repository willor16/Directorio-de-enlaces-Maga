// 1. CARGA INICIAL
document.addEventListener('DOMContentLoaded', async () => {
    await cargarSelect('/api/listas?tipo=institucion', 'institucion');
    await cargarSelect('/api/listas?tipo=departamento', 'departamento');
    // Aseguramos que el estado inicial sea correcto (municipio visible pero desactivado)
    gestionarTerritorio(); 
});

// Función auxiliar para llenar selects
async function cargarSelect(url, idElemento) {
    try {
        const res = await fetch(url);
        const datos = await res.json();
        const select = document.getElementById(idElemento);
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

// 2. NUEVA FUNCIÓN: Gestionar visibilidad según Enlace Territorial
window.gestionarTerritorio = function() {
    const tipo = document.getElementById('tipoEnlace').value;
    const divMunicipio = document.getElementById('divMunicipio');
    const selectMunicipio = document.getElementById('municipio');

    if (tipo === 'departamental') {
        // OCULTAR MUNICIPIO
        divMunicipio.style.display = 'none';       // Lo hace invisible
        selectMunicipio.required = false;          // Ya no es obligatorio
        selectMunicipio.value = "";                // Limpia el valor para que no se envíe basura
    } else {
        // MOSTRAR MUNICIPIO (Caso "municipal" o por defecto)
        divMunicipio.style.display = 'block';      // Lo hace visible
        selectMunicipio.required = true;           // Vuelve a ser obligatorio
    }
};

// 3. CARGA DE MUNICIPIOS
window.cargarMunicipios = async function() {
    const deptoSelect = document.getElementById('departamento');
    const muniSelect = document.getElementById('municipio');
    const depto = deptoSelect.value;

    // Solo cargamos si el campo es visible
    if (document.getElementById('divMunicipio').style.display === 'none') return;

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

// 4. ENVÍO DEL FORMULARIO
document.getElementById('registroForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnGuardar');
    const textoOriginal = btn.innerText;
    
    btn.innerText = "Guardando..."; 
    btn.disabled = true;

    // Recogemos los datos (si municipio está oculto, enviará vacío "")
    const data = {
        institucion: document.getElementById('institucion').value,
        departamento: document.getElementById('departamento').value,
        municipio: document.getElementById('municipio').value, 
        nombre: document.getElementById('nombre').value,
        puesto: document.getElementById('puesto').value,
        unidad: document.getElementById('unidad').value,
        correo: document.getElementById('correo').value,
        celular: document.getElementById('celular').value,
        // (Opcional) Si quisieras guardar qué tipo de enlace eligió, podrías agregarlo aquí, 
        // pero por ahora lo dejamos solo como lógica visual como pediste.
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
            // Restablecer estados visuales
            document.getElementById('municipio').disabled = true;
            document.getElementById('divMunicipio').style.display = 'block'; // Volver a mostrar por defecto
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