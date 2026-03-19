document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const timeWidget = document.getElementById('timeWidget');
    const visitList = document.getElementById('visitList');
    const visitCount = document.getElementById('visitCount');
    const filterDateInput = document.getElementById('filterDate');
    const themeToggleBtn = document.getElementById('themeToggle');
    const btnExport = document.getElementById('btnExport');
    const statTotal = document.getElementById('statTotal');

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
                    obs: record.observaciones || "",
                    timestamp: new Date(record.fechaConsulta)
                }));
                updateList();
            }
        } catch (err) { console.error(err); }
    };

    // Filtro de fecha
    if (filterDateInput) {
        filterDateInput.addEventListener('change', (e) => fetchHistory(e.target.value));
    }

    // Render List
    const updateList = () => {
        visitCount.textContent = visits.length;
        if(statTotal) statTotal.textContent = visits.length;
        visitList.innerHTML = '';
        
        if (visits.length === 0) {
            visitList.innerHTML = '<div class="empty-state" style="text-align: center; padding: 3rem; color: var(--text-secondary);"><i class="ph ph-users-three" style="font-size: 3rem; margin-bottom: 1rem;"></i><p>Sin registros para esta fecha.</p></div>';
            return;
        }

        const fragment = document.createDocumentFragment();
        visits.forEach(visit => {
            const timeString = visit.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            const card = document.createElement('div');
            card.className = 'visit-card';
            card.innerHTML = `
                <div class="visit-info">
                    <span class="visit-name" style="font-weight: 600;">${visit.nombreCompleto}</span>
                    <span class="visit-dni" style="color: var(--text-secondary); display: block; margin-top: 0.2rem;"><i class="ph ph-identification-card"></i> ${visit.dni}</span>
                    <span class="visit-time" style="font-size: 0.85rem; background: var(--input-bg); padding: 0.2rem 0.5rem; border-radius: 6px; margin-top: 0.5rem; display: inline-block;">${timeString}</span>
                    ${visit.obs ? `<span class="visit-obs" style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.5rem; display: block;"><i class="ph ph-note"></i> <strong>Obs:</strong> ${visit.obs}</span>` : ''}
                </div>
                <div class="visit-dest" style="background: var(--accent-glow); color: var(--accent-color); padding: 0.5rem 1rem; border-radius: 8px; font-weight: 500;"><i class="ph ph-door"></i> ${visit.depto}</div>
            `;
            fragment.appendChild(card);
        });
        visitList.appendChild(fragment);
    };

    // Exportar a Excel
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
            link.download = `Reporte_${filterDateInput.value}.xls`;
            link.click();
        });
    }

    // Iniciar
    fetchHistory(today);
});
