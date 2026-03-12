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
        
        // Sync icon on load (dark-theme class is added in index.html head)
        if (document.documentElement.classList.contains('dark-theme')) {
            themeIcon.className = 'ph ph-sun';
        }

        themeToggleBtn.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark-theme');
            
            if (document.documentElement.classList.contains('dark-theme')) {
                localStorage.setItem('theme', 'dark');
                themeIcon.className = 'ph ph-sun';
            } else {
                localStorage.setItem('theme', 'light');
                themeIcon.className = 'ph ph-moon';
            }
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

    // Initial Time Set
    timeWidget.textContent = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true });

    // Llamada al backend Spring Boot (Ruta Relativa para Render/Producción)
    const fetchDniData = async (dni) => {
        try {
            // Se eliminó http://localhost:8080 para que funcione en cualquier servidor
            const response = await fetch(`/api/v1/personas/dni/${dni}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.mensaje || "DNI no encontrado o servicio inactivo");
            }

            const data = await response.json();
            return {
                nombres: data.nombres,
                apellidos: `${data.apellidoPaterno} ${data.apellidoMaterno}`.trim()
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
                    nombreCompleto: `${record.nombres} ${record.apellidos}`.trim(),
                    depto: "N/A", // Histórico desde DB no tiene destino
                    timestamp: new Date(record.fechaConsulta)
                }));
                updateList();
            }
        } catch (err) {
            console.error("Error al cargar historial:", err);
        }
    };

    if (filterDateInput) {
        filterDateInput.addEventListener('change', (e) => {
            fetchHistory(e.target.value);
        });
        // Cargar visita de hoy al inicio
        fetchHistory(today);
    }

    // Handle Search
    const searchDni = async () => {
        const dniValue = dniInput.value.trim();

        if (dniValue.length < 8) {
            showHelper("El DNI debe tener 8 dígitos", true);
            return;
        }

        if (isFetching) return;

        isFetching = true;
        searchBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i>';
        showHelper("Consultando en Reniec...", false);
        dniHelper.style.color = "var(--text-secondary)";

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

    const showHelper = (msg, isError) => {
        dniHelper.textContent = msg;
        dniHelper.className = `helper-text visible ${isError ? 'error' : ''}`;
        if(isError) dniHelper.style.color = "#ef4444";
    };

    // Event Listeners
    searchBtn.addEventListener('click', searchDni);

    dniInput.addEventListener('keypress', (e) => {
        if(e.key < '0' || e.key > '9') {
            e.preventDefault();
        }
        if (e.key === 'Enter') {
            e.preventDefault();
            searchDni();
        }
    });

    dniInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');

        if(e.target.value.length === 8 && !nombreInput.value) {
            searchDni();
        } else if (e.target.value.length < 8) {
            nombreInput.value = "";
            apellidoInput.value = "";
            dniHelper.classList.remove('visible');
        }
    });

    // Handle Registration
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const dni = dniInput.value;
        const nombre = nombreInput.value;
        const apellido = apellidoInput.value;
        const depto = deptoInput.value;

        if (!dni || !nombre || !apellido || !depto) {
            return;
        }

        // Add to state
        const newVisit = {
            id: Date.now(),
            dni,
            nombreCompleto: `${nombre} ${apellido}`,
            depto,
            timestamp: new Date()
        };

        visits.unshift(newVisit);

        // Update UI
        updateList();

        // Reset Form
        registerForm.reset();
        nombreInput.value = "";
        apellidoInput.value = "";
        dniHelper.classList.remove('visible');
        dniInput.focus();

        // Success Feedback
        const originalBtnText = registerBtn.innerHTML;
        registerBtn.innerHTML = '<i class="ph ph-check-circle"></i> Registrado con éxito!';
        registerBtn.style.background = 'var(--success-color)';
        registerBtn.style.boxShadow = '0 10px 20px -10px rgba(16, 185, 129, 0.5)';

        setTimeout(() => {
            registerBtn.innerHTML = originalBtnText;
            registerBtn.style.background = '';
            registerBtn.style.boxShadow = '';
        }, 2000);
    });

    const calculateStats = () => {
        if (!statTotal) return;

        statTotal.textContent = visits.length;

        if (visits.length === 0) {
            statPeak.textContent = '--:--';
            statLast.textContent = 'N/A';
            return;
        }

        // Último ingreso (es el primer elemento porque se ordenan desc)
        const lastFirstName = visits[0].nombreCompleto.split(' ')[0] || 'N/A';
        statLast.textContent = lastFirstName;

        // Hora pico
        const hourCounts = {};
        visits.forEach(v => {
            const hour = v.timestamp.getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });

        let peakHour = -1;
        let maxCount = 0;
        for (const [hour, count] of Object.entries(hourCounts)) {
            if (count > maxCount) {
                maxCount = count;
                peakHour = parseInt(hour, 10);
            }
        }

        if (peakHour !== -1) {
            const currentHourStr = peakHour.toString().padStart(2, '0');
            const nextHourStr = ((peakHour + 1) % 24).toString().padStart(2, '0');
            statPeak.textContent = `${currentHourStr}:00 - ${nextHourStr}:00`;
        } else {
            statPeak.textContent = '--:--';
        }
    };

    const updateList = () => {
        visitCount.textContent = visits.length;
        calculateStats();

        if (visits.length === 0) {
            visitList.innerHTML = `
                <div class="empty-state">
                    <i class="ph ph-users-three"></i>
                    <p>No hay visitas registradas aún.</p>
                </div>
            `;
            return;
        }

        visitList.innerHTML = '';
        
        // Optimización del DOM: uso de DocumentFragment para evitar reflows con cada appendChild
        const fragment = document.createDocumentFragment();

        visits.forEach(visit => {
            const timeString = visit.timestamp.toLocaleTimeString('es-PE', {
                hour: '2-digit',
                minute: '2-digit'
            });

            const card = document.createElement('div');
            card.className = 'visit-card';
            
            // Reutilización de fragmentos para inserción masiva y optimizada
            card.innerHTML = `
                <div class="visit-info">
                    <span class="visit-name">${visit.nombreCompleto}</span>
                    <span class="visit-dni">
                        <i class="ph ph-identification-card"></i>
                        ${visit.dni}
                    </span>
                    <span class="visit-time">${timeString}</span>
                </div>
                <div class="visit-dest">
                    <i class="ph ph-door"></i>
                    ${visit.depto}
                </div>
            `;
            fragment.appendChild(card);
        });
        
        visitList.appendChild(fragment);
    };

    const exportToCSV = () => {
        if (visits.length === 0) return;

        const headers = ["Departamento_Destino", "Nombre_Completo", "DNI", "Fecha", "Hora_Entrada"];
        const rows = visits.map(v => {
            const dateStr = v.timestamp.toLocaleDateString('es-PE');
            const timeStr = v.timestamp.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
            // Escapar datos
            const dept = `"${(v.depto || 'N/A').replace(/"/g, '""')}"`;
            const name = `"${v.nombreCompleto.replace(/"/g, '""')}"`;
            return [dept, name, v.dni, dateStr, timeStr].join(",");
        });

        const csvContent = headers.join(",") + "\n" + rows.join("\n");
        // BOM para asegurar UTF-8 en Excel
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `visitas_shg_${filterDateInput ? filterDateInput.value : 'export'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (btnExport) {
        btnExport.addEventListener('click', exportToCSV);
    }
});