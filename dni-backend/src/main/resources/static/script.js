document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const timeWidget = document.getElementById('timeWidget');
    const dniInput = document.getElementById('dni');
    const nombreInput = document.getElementById('nombre');
    const apellidoInput = document.getElementById('apellido');
    const deptoInput = document.getElementById('departamento');
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
        
        const updateIcon = (isDark) => {
            themeIcon.className = isDark ? 'ph ph-sun' : 'ph ph-moon';
        };

        // Sync icon on load
        updateIcon(document.documentElement.classList.contains('dark-theme'));

        themeToggleBtn.addEventListener('click', () => {
            const isDark = document.documentElement.classList.toggle('dark-theme');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            updateIcon(isDark);
        });
    }

    // State
    let visits = [];
    let isFetching = false;

    // Inicializar fecha
    const today = new Date().toISOString().split('T')[0];
    if (filterDateInput) {
        filterDateInput.value = today;
    }

    // Update Time
    setInterval(() => {
        const now = new Date();
        timeWidget.textContent = now.toLocaleTimeString('es-PE', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true
        });
    }, 1000);

    timeWidget.textContent = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true });

    // API Calls
    const fetchDniData = async (dni) => {
        try {
            const response = await fetch(`/api/v1/personas/dni/${dni}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.mensaje || "DNI no encontrado");
            }
            const data = await response.json();
            return {
                nombres: data.nombres,
                apellidos: `${data.apellidoPaterno || ''} ${data.apellidoMaterno || ''}`.trim()
            };
        } catch (error) {
            throw error;
        }
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
                    depto: record.departamento || "N/A", // Mapeo corregido para Java
                    timestamp: new Date(record.fechaConsulta)
                }));
                updateList();
            }
        } catch (err) {
            console.error("Error al cargar historial:", err);
        }
    };

    // Form Handlers
    const searchDni = async () => {
        const dniValue = dniInput.value.trim();
        if (dniValue.length < 8) {
            showHelper("El DNI debe tener 8 dígitos", true);
            return;
        }
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
            showHelper(error.message || "Error", true);
        } finally {
            isFetching = false;
            searchBtn.innerHTML = '<i class="ph ph-magnifying-glass"></i>';
        }
    };

    const showHelper = (msg, isError) => {
        dniHelper.textContent = msg;
        dniHelper.className = `helper-text visible ${isError ? 'error' : ''}`;
        if(isError) dniHelper.style.color = "#ef4444";
    };

    // Events
    searchBtn.addEventListener('click', searchDni);
    dniInput.addEventListener('keypress', (e) => {
        if(e.key === 'Enter') { e.preventDefault(); searchDni(); }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const dni = dniInput.value;
        const nombre = nombreInput.value;
        const apellido = apellidoInput.value;
        const depto = deptoInput.value;

        const originalBtnText = registerBtn.innerHTML;
        registerBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Registrando...';
        registerBtn.disabled = true;

        try {
            const response = await fetch('/api/v1/personas/manual', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dni, nombres: nombre, apellidos: apellido, departamento: depto })
            });

            if (response.ok) {
                const newVisit = {
                    id: Date.now(),
                    dni,
                    nombreCompleto: `${nombre} ${apellido}`,
                    depto,
                    timestamp: new Date()
                };
                visits.unshift(newVisit);
                updateList();
                registerForm.reset();
                nombreInput.value = "";
                apellidoInput.value = "";
                dniHelper.classList.remove('visible');
                registerBtn.innerHTML = '<i class="ph ph-check-circle"></i> ¡Listo!';
                registerBtn.style.background = 'var(--success-color)';
                setTimeout(() => {
                    registerBtn.innerHTML = originalBtnText;
                    registerBtn.style.background = '';
                    registerBtn.disabled = false;
                }, 2000);
            }
        } catch (error) {
            showHelper("Error de conexión", true);
            registerBtn.disabled = false;
        }
    });

    // UI Updates
    const updateList = () => {
        visitCount.textContent = visits.length;
        calculateStats();

        if (visits.length === 0) {
            visitList.innerHTML = '<div class="empty-state"><i class="ph ph-users-three"></i><p>Sin registros.</p></div>';
            return;
        }

        visitList.innerHTML = '';
        const fragment = document.createDocumentFragment();

        visits.forEach(visit => {
            const timeString = visit.timestamp.toLocaleTimeString('en-US', {
                hour: '2-digit', minute: '2-digit', hour12: true
            });

            const card = document.createElement('div');
            card.className = 'visit-card';
            card.innerHTML = `
                <div class="visit-info">
                    <span class="visit-name">${visit.nombreCompleto}</span>
                    <span class="visit-dni"><i class="ph ph-identification-card"></i> ${visit.dni}</span>
                    <span class="visit-time">${timeString}</span>
                </div>
                <div class="visit-dest"><i class="ph ph-door"></i> ${visit.depto}</div>
            `;
            fragment.appendChild(card);
        });
        visitList.appendChild(fragment);
    };

    const calculateStats = () => {
        if (!statTotal) return;
        statTotal.textContent = visits.length;
        if (visits.length > 0) {
            statLast.textContent = visits[0].nombreCompleto.split(' ')[0];
            const hourCounts = {};
            visits.forEach(v => {
                const hour = v.timestamp.getHours();
                hourCounts[hour] = (hourCounts[hour] || 0) + 1;
            });
            let peak = Object.keys(hourCounts).reduce((a, b) => hourCounts[a] > hourCounts[b] ? a : b);
            statPeak.textContent = `${peak.toString().padStart(2, '0')}:00`;
        }
    };

    // Export
    const exportToExcel = () => {
        if (visits.length === 0) return;
        let tableHtml = `<html><head><meta charset="utf-8"><style>th{background:#6366f1;color:white;padding:10px;}td{padding:8px;border:1px solid #ddd;}</style></head><body><table><thead><tr><th>DNI</th><th>Nombre</th><th>Dpto</th><th>Fecha</th><th>Hora</th></tr></thead><tbody>`;
        visits.forEach(v => {
            tableHtml += `<tr><td style='mso-number-format:"\\@";'>${v.dni}</td><td>${v.nombreCompleto}</td><td>${v.depto}</td><td>${v.timestamp.toLocaleDateString()}</td><td>${v.timestamp.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:true})}</td></tr>`;
        });
        tableHtml += `</tbody></table></body></html>`;
        const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Reporte_{SHG}.xls`;
        link.click();
    };

    if (btnExport) btnExport.addEventListener('click', exportToExcel);
    if (filterDateInput) {
        filterDateInput.addEventListener('change', (e) => fetchHistory(e.target.value));
        fetchHistory(today);
    }
});
