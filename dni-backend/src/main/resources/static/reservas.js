document.addEventListener('DOMContentLoaded', () => {

    // ─── DOM References ───────────────────────────────────────
    const timeWidget     = document.getElementById('timeWidget');
    const themeToggleBtn = document.getElementById('themeToggle');
    const form           = document.getElementById('reservaForm');
    const btnGuardar     = document.getElementById('btnGuardar');
    const conflictAlert  = document.getElementById('conflictAlert');
    const conflictMsg    = document.getElementById('conflictMsg');
    const reservasList   = document.getElementById('reservasList');
    const reservaCount   = document.getElementById('reservaCount');
    const filterDateInput = document.getElementById('filterDate');
    const areaPills      = document.querySelectorAll('.pill');

    // ─── Theme Toggle ─────────────────────────────────────────
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

    // ─── Clock ────────────────────────────────────────────────
    const tick = () => {
        timeWidget.textContent = new Date().toLocaleTimeString('es-PE', {
            hour: '2-digit', minute: '2-digit', hour12: true
        });
    };
    tick();
    setInterval(tick, 1000);

    // ─── State ────────────────────────────────────────────────
    const today = new Date().toISOString().split('T')[0];
    let allReservas = [];
    let activeArea  = 'all';

    // ─── Set default date values ──────────────────────────────
    document.getElementById('fecha').value = today;
    filterDateInput.value = today;

    // ─── Area color map ───────────────────────────────────────
    const areaClass = (area) => {
        if (area.includes('Parrillas')) return 'area-parrillas';
        if (area.includes('SUM'))       return 'area-sum';
        if (area.includes('Gimnasio'))  return 'area-gimnasio';
        if (area.includes('Piscina'))   return 'area-piscina';
        return '';
    };

    // ─── Fetch reservas ───────────────────────────────────────
    const fetchReservas = async (dateStr) => {
        try {
            const res = await fetch(`/api/v1/reservas?fecha=${dateStr}`);
            if (res.ok) {
                allReservas = await res.json();
                renderList();
            }
        } catch (err) {
            console.error('Error al cargar reservas:', err);
        }
    };

    // ─── Render list ──────────────────────────────────────────
    const renderList = () => {
        const filtered = activeArea === 'all'
            ? allReservas
            : allReservas.filter(r => r.areaNombre === activeArea);

        reservaCount.textContent = filtered.length;
        reservasList.innerHTML = '';

        if (filtered.length === 0) {
            reservasList.innerHTML = `
                <div class="empty-state" style="text-align:center;padding:3rem;color:var(--text-secondary);">
                    <i class="ph ph-calendar-x" style="font-size:3rem;margin-bottom:1rem;color:var(--text-secondary);display:block;"></i>
                    <p>No hay reservas para este día.</p>
                </div>`;
            return;
        }

        const frag = document.createDocumentFragment();
        filtered.forEach(r => {
            const card = document.createElement('div');
            card.className = `reserva-card ${areaClass(r.areaNombre)}`;
            card.innerHTML = `
                <div>
                    <div class="rc-area">${r.areaNombre}</div>
                    <div class="rc-meta">
                        <i class="ph ph-user" style="font-size:0.85rem;"></i> ${r.residenteNombre}
                        &nbsp;·&nbsp;
                        <i class="ph ph-door" style="font-size:0.85rem;"></i> Depto. ${r.departamento}
                    </div>
                </div>
                <div class="rc-horario">
                    ${formatTime(r.horaInicio)} – ${formatTime(r.horaFin)}
                    <span class="rc-time-label">horario</span>
                </div>`;
            frag.appendChild(card);
        });
        reservasList.appendChild(frag);
    };

    // Helper: format LocalTime array [H, M] or string "HH:MM:SS" → "HH:MM"
    const formatTime = (t) => {
        if (Array.isArray(t)) {
            return `${String(t[0]).padStart(2, '0')}:${String(t[1]).padStart(2, '0')}`;
        }
        return String(t).substring(0, 5);
    };

    // ─── Filter date change ───────────────────────────────────
    filterDateInput.addEventListener('change', (e) => fetchReservas(e.target.value));

    // ─── Area pills ───────────────────────────────────────────
    areaPills.forEach(pill => {
        pill.addEventListener('click', () => {
            areaPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            activeArea = pill.dataset.area;
            renderList();
        });
    });

    // ─── Hide conflict alert on form change ──────────────────
    form.addEventListener('input', () => {
        conflictAlert.style.display = 'none';
    });

    // ─── Form submit ─────────────────────────────────────────
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        conflictAlert.style.display = 'none';

        const payload = {
            areaNombre:      document.getElementById('areaNombre').value,
            residenteNombre: document.getElementById('residenteNombre').value.trim(),
            departamento:    document.getElementById('departamento').value.trim(),
            fecha:           document.getElementById('fecha').value,
            horaInicio:      document.getElementById('horaInicio').value,
            horaFin:         document.getElementById('horaFin').value
        };

        // Client-side: hora fin > hora inicio
        if (payload.horaFin <= payload.horaInicio) {
            conflictMsg.textContent = 'La hora de fin debe ser posterior a la hora de inicio.';
            conflictAlert.style.display = 'flex';
            return;
        }

        btnGuardar.disabled = true;
        const originalHTML = btnGuardar.innerHTML;
        btnGuardar.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Guardando...';

        try {
            const res = await fetch('/api/v1/reservas', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(payload)
            });

            if (res.ok) {
                // Éxito
                form.reset();
                document.getElementById('fecha').value = today;
                btnGuardar.innerHTML = '<i class="ph ph-check-circle"></i> ¡Reserva Confirmada!';
                btnGuardar.style.background = 'var(--success-color)';
                setTimeout(() => {
                    btnGuardar.innerHTML = originalHTML;
                    btnGuardar.style.background = '';
                    btnGuardar.disabled = false;
                }, 2500);

                // Refrescar lista si el filtro está en la misma fecha
                if (filterDateInput.value === payload.fecha) {
                    fetchReservas(payload.fecha);
                }
            } else {
                // Error del servidor (400 o 409)
                const data = await res.json().catch(() => ({}));
                const msg = data.mensaje || 'Error al guardar la reserva.';
                conflictMsg.textContent = msg;
                conflictAlert.style.display = 'flex';
                btnGuardar.disabled = false;
                btnGuardar.innerHTML = originalHTML;
            }
        } catch (err) {
            console.error(err);
            conflictMsg.textContent = 'Error de red. Verifique su conexión.';
            conflictAlert.style.display = 'flex';
            btnGuardar.disabled = false;
            btnGuardar.innerHTML = originalHTML;
        }
    });

    // ─── Init ─────────────────────────────────────────────────
    fetchReservas(today);
});
