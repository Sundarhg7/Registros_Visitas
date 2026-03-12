document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const timeWidget = document.getElementById('timeWidget');
    const dniInput = document.getElementById('dni');
    const nombreInput = document.getElementById('nombre');
    const apellidoInput = document.getElementById('apellido');
    const deptoInput = document.getElementById('departamento');
    const obsInput = document.getElementById('observaciones'); // Nuevo
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
    const today = new Date().toISOString().split('T')[0];
    if (filterDateInput) filterDateInput.value = today;

    // Reloj
    setInterval(() => {
        timeWidget.textContent = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true });
    }, 1000);

    // API Calls
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
                    obs: record.observaciones || "", // Mapeo de observaciones
                    timestamp: new Date(record.fechaConsulta)
                }));
                updateList();
            }
        } catch (err) { console.error(err); }
    };

    // Registro
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const dni = dniInput.value;
        const nombre = nombreInput.value;
        const apellido = apellidoInput.value;
        const depto = deptoInput.value;
        const observaciones = obsInput.value;

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
                fetchHistory(filterDateInput.value); // Recargar lista
                registerForm.reset();
                registerBtn.innerHTML = '<i class="ph ph-check-circle"></i> ¡Hecho!';
                setTimeout(() => { registerBtn.innerHTML = originalText; registerBtn.disabled = false; }, 2000);
            }
        } catch (error) { registerBtn.disabled = false; }
    });

    // Render List
    const updateList = () => {
        visitCount.textContent = visits.length;
        visitList.innerHTML = '';
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
                    ${visit.obs ? `<span class="visit-obs"><i class="ph ph-note"></i> ${visit.obs}</span>` : ''}
                </div>
                <div class="visit-dest"><i class="ph ph-door"></i> ${visit.depto}</div>
            `;
            fragment.appendChild(card);
        });
        visitList.appendChild(fragment);
    };

    // Iniciar
    fetchHistory(today);
});
