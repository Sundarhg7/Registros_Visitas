document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const timeWidget = document.getElementById('timeWidget');
    const ocurrenciasList = document.getElementById('ocurrenciasList');
    const ocurrenciaCount = document.getElementById('ocurrenciaCount');
    const filterDateInput = document.getElementById('filterDate');
    const themeToggleBtn = document.getElementById('themeToggle');
    const btnGuardar = document.getElementById('btnGuardar');
    const form = document.getElementById('ocurrenciaForm');

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
    let ocurrencias = [];
    const today = new Date().toISOString().split('T')[0];
    if (filterDateInput) filterDateInput.value = today;

    // Reloj
    setInterval(() => {
        timeWidget.textContent = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true });
    }, 1000);

    // API Calls
    const fetchOcurrencias = async (dateStr) => {
        try {
            const response = await fetch(`/api/v1/ocurrencias?fecha=${dateStr}`);
            if (response.ok) {
                ocurrencias = await response.json();
                updateList();
            }
        } catch (err) { console.error(err); }
    };

    // Filter
    if (filterDateInput) {
        filterDateInput.addEventListener('change', (e) => fetchOcurrencias(e.target.value));
    }

    // Guardar
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const payload = {
            titulo: document.getElementById('titulo').value.trim(),
            severidad: document.getElementById('severidad').value,
            detalle: document.getElementById('detalle').value.trim()
        };

        btnGuardar.disabled = true;
        const originalText = btnGuardar.innerHTML;
        btnGuardar.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Guardando...';

        try {
            const res = await fetch('/api/v1/ocurrencias', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                form.reset();
                if(filterDateInput.value === today) {
                    fetchOcurrencias(today);
                } else {
                    filterDateInput.value = today;
                    fetchOcurrencias(today);
                }
                btnGuardar.innerHTML = '<i class="ph ph-check-circle"></i> Guardado';
                setTimeout(() => { btnGuardar.innerHTML = originalText; btnGuardar.disabled = false; }, 2000);
            } else {
                alert("Error al guardar la ocurrencia.");
                btnGuardar.disabled = false;
                btnGuardar.innerHTML = originalText;
            }
        } catch (error) {
            console.error(error);
            btnGuardar.disabled = false;
            btnGuardar.innerHTML = originalText;
        }
    });

    const getSevClass = (sev) => {
        switch(sev.toLowerCase()) {
            case 'leve': return 'leve';
            case 'moderado': return 'moderado';
            case 'grave': return 'grave';
            default: return '';
        }
    };

    const getSevColor = (sev) => {
        switch(sev.toLowerCase()) {
            case 'leve': return 'var(--success-color)';
            case 'moderado': return '#f59e0b';
            case 'grave': return '#ef4444';
            default: return 'var(--accent-color)';
        }
    };

    // Render List
    const updateList = () => {
        ocurrenciaCount.textContent = ocurrencias.length;
        ocurrenciasList.innerHTML = '';
        
        if (ocurrencias.length === 0) {
            ocurrenciasList.innerHTML = '<div class="empty-state" style="text-align: center; padding: 3rem; color: var(--text-secondary);"><i class="ph ph-shield-check" style="font-size: 3rem; margin-bottom: 1rem; color: var(--success-color);"></i><p>No se reportan ocurrencias para este día.</p></div>';
            return;
        }

        const fragment = document.createDocumentFragment();
        ocurrencias.forEach(oc => {
            const d = new Date(oc.fechaHora);
            const timeString = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            
            const card = document.createElement('div');
            card.className = 'ocurrencia-card';
            card.style.borderLeftColor = getSevColor(oc.severidad);
            
            card.innerHTML = `
                <div class="oc-header">
                    <div style="display: flex; align-items: center; gap: 0.8rem;">
                        <span class="oc-sev ${getSevClass(oc.severidad)}">${oc.severidad}</span>
                        <span class="oc-title">${oc.titulo}</span>
                    </div>
                    <span class="oc-time"><i class="ph ph-clock"></i> ${timeString}</span>
                </div>
                <div class="oc-detail">${oc.detalle}</div>
            `;
            fragment.appendChild(card);
        });
        ocurrenciasList.appendChild(fragment);
    };

    // Iniciar
    fetchOcurrencias(today);
});
