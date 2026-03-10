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

    // State
    let visits = [];
    let isFetching = false;

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

    // Llamada al backend Spring Boot (Proxy)
    const fetchDniData = async (dni) => {
        try {
            const response = await fetch(`http://localhost:8080/api/v1/personas/dni/${dni}`);
            
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

    const updateList = () => {
        visitCount.textContent = visits.length;

        if (visits.length === 0) {
            return;
        }

        visitList.innerHTML = '';

        visits.forEach(visit => {
            const timeString = visit.timestamp.toLocaleTimeString('es-PE', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });

            const card = document.createElement('div');
            card.className = 'visit-card';
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
            visitList.appendChild(card);
        });
    };
});
