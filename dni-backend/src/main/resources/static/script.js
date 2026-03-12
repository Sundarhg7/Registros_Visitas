document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const timeWidget = document.getElementById('timeWidget');
    const dniInput = document.getElementById('dni');
    const nombreInput = document.getElementById('nombre');
    const apellidoInput = document.getElementById('apellido');
    const deptoInput = document.getElementById('departamento');
    const obsInput = document.getElementById('observaciones'); // El nuevo campo
    const searchBtn = document.getElementById('searchBtn');
    const dniHelper = document.getElementById('dniHelper');
    const registerForm = document.getElementById('registrationForm');
    const visitList = document.getElementById('visitList');
    const visitCount = document.getElementById('visitCount');
    const registerBtn = document.getElementById('registerBtn');
    const filterDateInput = document.getElementById('filterDate');
    const themeToggleBtn = document.getElementById('themeToggle');
    const btnExport = document.getElementById('btnExport');
    const statTotal = document.getElementById('statTotal');
    const statPeak = document.getElementById('statPeak');
    const statLast = document.getElementById('statLast');

    // Theme Toggle Logic
    if (themeToggleBtn) {
        const themeIcon = themeToggleBtn.querySelector('i');
        const updateIcon = (isDark) => { themeIcon.className = isDark ? 'ph ph-sun' : 'ph ph-moon'; };
        updateIcon(document.documentElement.classList.contains('dark-theme'));
        themeToggleBtn.addEventListener('click', () => {
            const isDark = document.documentElement.classList.toggle('dark-theme');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            updateIcon(isDark);
        });
    }

    // State & Init
    let visits = [];
    let isFetching = false;
    const today = new Date().toISOString().split('T')[0];
    if (filterDateInput) filterDateInput.value = today;

    // Reloj
    setInterval(() => {
        timeWidget.textContent = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true });
    }, 1000);

    // API Calls
    const fetchDniData = async (dni) => {
        try {
            const response = await fetch(`/api/v1/personas/dni/${dni}`);
            if (!response.ok) throw new Error("DNI no encontrado");
            const data = await response.json();
            return {
                nombres: data.nombres,
                apellidos: `${data.apellidoPaterno || ''} ${data.apellidoMaterno || ''}`.trim()
            };
        } catch (error) { throw error; }
    };

    const fetchHistory = async (dateStr) => {
        try {
            const response = await fetch(`/api/v1/personas/historico?fecha=${dateStr}`);
            if (response.ok) {
                const data = await response.json();
                visits = data.map(record => ({
                    id: record.id,
                    dni: record.dni,
                    nombreCompleto: `${record.nombres || ''} ${record.apellidos || ''}`.trim(),
                    depto: record.departamento || "N/A",
                    obs: record.observaciones || "", // Aquí mapeamos las observaciones
                    timestamp: new Date(record.fechaConsulta)
                }));
                updateList();
            }
        } catch (err) { console.error(err); }
    };

    // Funciones de Búsqueda (¡Las que faltaban!)
    const showHelper = (msg, isError) => {
        dniHelper.textContent = msg;
        dniHelper.className = `helper-text visible ${isError ? 'error' : ''}`;
        if(isError) dniHelper.style.color = "#ef4444";
    };

    const searchDni = async () => {
        const dniValue = dniInput.value.trim();
        if (dniValue.length < 8) { showHelper("El DNI debe tener 8 dígitos", true); return; }
        if (isFetching) return;

        isFetching = true;
        searchBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i>';
        showHelper("Consultando...", false);

        try {
            const data = await fetchDniData(dniValue);
            nombreInput.value = data.nombres;
            apellidoInput.value = data.apellidos;
            showHelper("Datos verificados", false);
            dniHelper.style.color = "var(--success-color)";
            deptoInput.focus();
        } catch (error) {
            nombreInput.value = "";
            apellidoInput.value = "";
            showHelper(error.message || "Error al buscar", true);
        } finally {
            isFetching = false;
            searchBtn.innerHTML = '<i class="ph ph-magnifying-glass"></i>';
        }
    };

    // Event Listeners
    searchBtn.addEventListener('click', searchDni);
    dniInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); searchDni(); } });
    
    // Filtro de fecha
    if (filterDateInput) {
        filterDateInput.addEventListener('change', (e) => fetchHistory(e.target.value));
    }

    // Registro
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const dni = dniInput.value;
        const nombre = nombreInput.value;
        const apellido = apellidoInput.value;
        const depto = deptoInput.value;
        const observaciones = obsInput ? obsInput.value : "";

        registerBtn.disabled = true;
        const originalText = registerBtn.innerHTML;
        registerBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Guardando...';

        try {
            const response = await fetch('/api/v1/personas/manual', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dni, nombres: nombre, apellidos: apellido, departamento: depto, observaciones })
            });

            if (response.ok) {
                fetchHistory(filterDateInput.value); 
                registerForm.reset();
                dniHelper.classList.remove('visible');
                registerBtn.innerHTML = '<i class="ph ph-check-circle"></i> ¡Hecho!';
                setTimeout(() => { registerBtn.innerHTML = originalText; registerBtn.disabled = false; }, 2000);
            }
        } catch (error) { registerBtn.disabled = false; }
    });

    // Render List
    const updateList = () => {
        visitCount.textContent = visits.length;
        if(statTotal) statTotal.textContent = visits.length;
        visitList.innerHTML = '';
        
        if (visits.length === 0) {
            visitList.innerHTML = '<div class="empty-state"><i class="ph ph-users-three"></i><p>Sin registros.</p></div>';
            return;
        }

        const fragment = document.createDocumentFragment();
        visits.forEach(visit => {
            const timeString = visit.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            const card = document.createElement('div');
            card.className = 'visit-card';
            card.innerHTML = `
                <div class="visit-info">
                    <span class="visit-name">${visit.nombreCompleto}</span>
                    <span class="visit-dni"><i class="ph ph-identification-card"></i> ${visit.dni}</span>
                    <span class="visit-time">${timeString}</span>
                    ${visit.obs ? `<span class="visit-obs" style="font-size: 0.8rem; color: #64748b; margin-top: 4px; display: block;"><i class="ph ph-note"></i> ${visit.obs}</span>` : ''}
                </div>
                <div class="visit-dest"><i class="ph ph-door"></i> ${visit.depto}</div>
            `;
            fragment.appendChild(card);
        });
        visitList.appendChild(fragment);
    };

    // Exportar a Excel (Restaurado)
    if (btnExport) {
        btnExport.addEventListener('click', () => {
            if (visits.length === 0) return;
            let tableHtml = `<html><head><meta charset="utf-8"></head><body><table border="1"><tr><th>DNI</th><th>Nombre</th><th>Dpto</th><th>Observaciones</th><th>Fecha</th><th>Hora</th></tr>`;
            visits.forEach(v => {
                tableHtml += `<tr><td style='mso-number-format:"\\@";'>${v.dni}</td><td>${v.nombreCompleto}</td><td>${v.depto}</td><td>${v.obs}</td><td>${v.timestamp.toLocaleDateString()}</td><td>${v.timestamp.toLocaleTimeString()}</td></tr>`;
            });
            tableHtml += `</table></body></html>`;
            const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `Reporte.xls`;
            link.click();
        });
    }

    // Iniciar
    fetchHistory(today);
});
