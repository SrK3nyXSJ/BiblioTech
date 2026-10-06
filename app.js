


// State Variables
let livros = JSON.parse(localStorage.getItem('biblio_livros')) || INITIAL_LIVROS;
let usuarios = JSON.parse(localStorage.getItem('biblio_usuarios')) || INITIAL_USUARIOS;
let emprestimos = JSON.parse(localStorage.getItem('biblio_emprestimos')) || INITIAL_EMPRESTIMOS;

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    setupDateDisplay();
    setupSidebarToggle();
    setDefaultDates();
    
    // Sync LocalStorage if empty
    saveState();

    // Render all UI views
    renderDashboard();
    renderLivrosTable();
    renderUsuariosTable();
    renderEmprestimosTable();
    populateEmprestimoDropdowns();
});

// Save State Helper
function saveState() {
    localStorage.setItem('biblio_livros', JSON.stringify(livros));
    localStorage.setItem('biblio_usuarios', JSON.stringify(usuarios));
    localStorage.setItem('biblio_emprestimos', JSON.stringify(emprestimos));
}

// Navigation / Tab Switching
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(`tab-${tabId}`).classList.remove('hidden');

    // Update Nav Buttons style
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-blue-600/90', 'text-white', 'bg-blue-600');
        btn.classList.add('hover:bg-slate-800', 'hover:text-white');
    });

    const activeBtn = document.getElementById(`nav-${tabId}`);
    if (activeBtn) {
        activeBtn.classList.add('bg-blue-600', 'text-white');
        activeBtn.classList.remove('hover:bg-slate-800');
    }

    // Update Header Title
    const titles = {
        dashboard: 'Dashboard / Visão Geral',
        livros: 'Cadastro e Gestão de Livros',
        usuarios: 'Cadastro e Gestão de Usuários',
        emprestimos: 'Registro de Empréstimos'
    };
    document.getElementById('pageTitle').textContent = titles[tabId] || 'Biblioteca';

    // Refresh specific components if needed
    if (tabId === 'dashboard') renderDashboard();
    if (tabId === 'emprestimos') populateEmprestimoDropdowns();

    // Mobile sidebar collapse on navigation
    if (window.innerWidth < 768) {
        document.getElementById('sidebar').classList.add('-translate-x-full');
    }
}

// Sidebar Responsiveness
function setupSidebarToggle() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggleSidebar');
    const closeBtn = document.getElementById('closeSidebarMobile');

    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('-translate-x-full');
    });

    closeBtn.addEventListener('click', () => {
        sidebar.classList.add('-translate-x-full');
    });
}

// Set Header Date
function setupDateDisplay() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date().toLocaleDateString('pt-BR', options);
    document.getElementById('currentDate').textContent = today.charAt(0).toUpperCase() + today.slice(1);
}

// Set Default Dates for New Loan
function setDefaultDates() {
    const today = new Date();
    const future = new Date();
    future.setDate(today.getDate() + 14); // Default 14 days loan

    document.getElementById('empDataEmprestimo').value = today.toISOString().split('T')[0];
    document.getElementById('empDataDevolucao').value = future.toISOString().split('T')[0];
}

// Toast Feedback Component
function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    const toastIcon = document.getElementById('toastIcon');

    toastMsg.textContent = message;
    
    if (isError) {
        toast.classList.remove('border-emerald-500');
        toast.classList.add('border-rose-500');
        toastIcon.setAttribute('data-lucide', 'alert-circle');
        toastIcon.className = 'w-5 h-5 text-rose-400';
    } else {
        toast.classList.remove('border-rose-500');
        toast.classList.add('border-emerald-500');
        toastIcon.setAttribute('data-lucide', 'check-circle');
        toastIcon.className = 'w-5 h-5 text-emerald-400';
    }
    lucide.createIcons();

    toast.classList.remove('translate-x-full');
    setTimeout(() => {
        toast.classList.add('translate-x-full');
    }, 3000);
}

// DASHBOARD LOGIC
function renderDashboard() {
    const totalLivros = livros.reduce((acc, item) => acc + parseInt(item.exemplares || 1), 0);
    const totalUsuarios = usuarios.length;
    const ativos = emprestimos.filter(e => e.status === 'Em Aberto').length;
    const devolvidos = emprestimos.filter(e => e.status === 'Devolvido').length;

    document.getElementById('statTotalLivros').textContent = totalLivros;
    document.getElementById('statTotalUsuarios').textContent = totalUsuarios;
    document.getElementById('statEmprestimosAtivos').textContent = ativos;
    document.getElementById('statEmprestimosDevolvidos').textContent = devolvidos;

    // Render Recent Loans (Top 5)
    const recent = [...emprestimos].reverse().slice(0, 5);
    const table = document.getElementById('dashboardRecentTable');
    table.innerHTML = '';

    if (recent.length === 0) {
        table.innerHTML = `<tr><td colspan="5" class="py-4 text-center text-slate-400">Nenhum empréstimo registrado.</td></tr>`;
        return;
    }

    recent.forEach(emp => {
        const badge = emp.status === 'Em Aberto' 
            ? `<span class="px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 rounded-full border border-amber-200">Em Aberto</span>`
            : `<span class="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200">Devolvido</span>`;

        table.innerHTML += `
            <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="py-3 px-4 font-medium text-slate-800">${emp.titulo}</td>
                <td class="py-3 px-4 text-slate-600">${emp.usuarioNome}</td>
                <td class="py-3 px-4 text-slate-500">${formatDate(emp.dataEmprestimo)}</td>
                <td class="py-3 px-4 text-slate-500">${formatDate(emp.dataDevolucao)}</td>
                <td class="py-3 px-4 text-center">${badge}</td>
            </tr>
        `;
    });
}

// BOOKS LOGIC
function handleCadastrarLivro(e) {
    e.preventDefault();
    const novoLivro = {
        id: Date.now().toString(),
        titulo: document.getElementById('livroTitulo').value.trim(),
        autor: document.getElementById('livroAutor').value.trim(),
        isbn: document.getElementById('livroIsbn').value.trim(),
        categoria: document.getElementById('livroCategoria').value,
        ano: document.getElementById('livroAno').value || '-',
        exemplares: parseInt(document.getElementById('livroExemplares').value) || 1
    };

    livros.push(novoLivro);
    saveState();
    renderLivrosTable();
    populateEmprestimoDropdowns();
    document.getElementById('formLivro').reset();
    showToast("Livro cadastrado com sucesso!");
}

function renderLivrosTable() {
    const query = document.getElementById('searchLivro').value.toLowerCase();
    const cat = document.getElementById('filterCategoria').value;
    const tbody = document.getElementById('livrosTableBody');
    tbody.innerHTML = '';

    const filtered = livros.filter(l => {
        const matchesQuery = l.titulo.toLowerCase().includes(query) || 
                             l.autor.toLowerCase().includes(query) || 
                             l.isbn.toLowerCase().includes(query);
        const matchesCat = cat === '' || l.categoria === cat;
        return matchesQuery && matchesCat;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="py-4 text-center text-slate-400">Nenhum livro encontrado.</td></tr>`;
        return;
    }

    filtered.forEach(l => {
        tbody.innerHTML += `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="py-3 px-4 font-semibold text-slate-800">${l.titulo}</td>
                <td class="py-3 px-4 text-slate-600">${l.autor}</td>
                <td class="py-3 px-4 text-slate-500 font-mono text-xs">${l.isbn}</td>
                <td class="py-3 px-4"><span class="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-md">${l.categoria}</span></td>
                <td class="py-3 px-4 text-slate-500">${l.ano}</td>
                <td class="py-3 px-4 text-center font-medium">${l.exemplares}</td>
                <td class="py-3 px-4 text-right">
                    <button onclick="excluirLivro('${l.id}')" class="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors" title="Excluir">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    lucide.createIcons();
}

function excluirLivro(id) {
    const temEmprestimoAtivo = emprestimos.some(e => e.livroId === id && e.status === 'Em Aberto');
    if (temEmprestimoAtivo) {
        showToast("Não é possível excluir: livro possui empréstimo ativo!", true);
        return;
    }

    livros = livros.filter(l => l.id !== id);
    saveState();
    renderLivrosTable();
    populateEmprestimoDropdowns();
    showToast("Livro removido com sucesso!");
}

// USERS LOGIC
function handleCadastrarUsuario(e) {
    e.preventDefault();
    const novoUsuario = {
        id: Date.now().toString(),
        nome: document.getElementById('usrNome').value.trim(),
        doc: document.getElementById('usrDoc').value.trim(),
        email: document.getElementById('usrEmail').value.trim(),
        telefone: document.getElementById('usrTelefone').value.trim() || '-',
        tipo: document.getElementById('usrTipo').value
    };

    usuarios.push(novoUsuario);
    saveState();
    renderUsuariosTable();
    populateEmprestimoDropdowns();
    document.getElementById('formUsuario').reset();
    showToast("Usuário cadastrado com sucesso!");
}

function renderUsuariosTable() {
    const query = document.getElementById('searchUsuario').value.toLowerCase();
    const tbody = document.getElementById('usuariosTableBody');
    tbody.innerHTML = '';

    const filtered = usuarios.filter(u => 
        u.nome.toLowerCase().includes(query) || 
        u.doc.toLowerCase().includes(query) || 
        u.email.toLowerCase().includes(query)
    );

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="py-4 text-center text-slate-400">Nenhum usuário encontrado.</td></tr>`;
        return;
    }

    filtered.forEach(u => {
        tbody.innerHTML += `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="py-3 px-4 font-semibold text-slate-800">${u.nome}</td>
                <td class="py-3 px-4 text-slate-600 font-mono text-xs">${u.doc}</td>
                <td class="py-3 px-4 text-slate-500">${u.email}</td>
                <td class="py-3 px-4 text-slate-500">${u.telefone}</td>
                <td class="py-3 px-4"><span class="px-2.5 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-full border border-blue-100">${u.tipo}</span></td>
                <td class="py-3 px-4 text-right">
                    <button onclick="excluirUsuario('${u.id}')" class="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors" title="Excluir">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    lucide.createIcons();
}

function excluirUsuario(id) {
    const temEmprestimoAtivo = emprestimos.some(e => e.usuarioId === id && e.status === 'Em Aberto');
    if (temEmprestimoAtivo) {
        showToast("Usuário possui pendência de empréstimo ativo!", true);
        return;
    }

    usuarios = usuarios.filter(u => u.id !== id);
    saveState();
    renderUsuariosTable();
    populateEmprestimoDropdowns();
    showToast("Usuário removido com sucesso!");
}

// LOAN LOGIC
function populateEmprestimoDropdowns() {
    const livroSelect = document.getElementById('empLivroSelect');
    const usuarioSelect = document.getElementById('empUsuarioSelect');

    livroSelect.innerHTML = '<option value="">Selecione um livro...</option>';
    usuarioSelect.innerHTML = '<option value="">Selecione um usuário...</option>';

    livros.forEach(l => {
        livroSelect.innerHTML += `<option value="${l.id}">${l.titulo} (${l.autor})</option>`;
    });

    usuarios.forEach(u => {
        usuarioSelect.innerHTML += `<option value="${u.id}">${u.nome} - ${u.doc}</option>`;
    });
}

function handleCadastrarEmprestimo(e) {
    e.preventDefault();
    const livroId = document.getElementById('empLivroSelect').value;
    const usuarioId = document.getElementById('empUsuarioSelect').value;

    const livroObj = livros.find(l => l.id === livroId);
    const usuarioObj = usuarios.find(u => u.id === usuarioId);

    if (!livroObj || !usuarioObj) {
        showToast("Selecione um livro e um usuário válidos!", true);
        return;
    }

    const novoEmprestimo = {
        id: Date.now().toString(),
        livroId: livroObj.id,
        titulo: livroObj.titulo,
        autor: livroObj.autor,
        usuarioId: usuarioObj.id,
        usuarioNome: usuarioObj.nome,
        dataEmprestimo: document.getElementById('empDataEmprestimo').value,
        dataDevolucao: document.getElementById('empDataDevolucao').value,
        status: "Em Aberto"
    };

    emprestimos.unshift(novoEmprestimo);
    saveState();
    renderEmprestimosTable();
    renderDashboard();
    
    // Reset dropdowns
    document.getElementById('empLivroSelect').value = "";
    document.getElementById('empUsuarioSelect').value = "";
    setDefaultDates();

    showToast("Empréstimo registrado com sucesso!");
}

function renderEmprestimosTable() {
    const query = document.getElementById('searchEmprestimo').value.toLowerCase();
    const statusFilter = document.getElementById('filterStatus').value;
    const tbody = document.getElementById('emprestimosTableBody');
    tbody.innerHTML = '';

    const filtered = emprestimos.filter(e => {
        const matchesQuery = e.titulo.toLowerCase().includes(query) || 
                             e.autor.toLowerCase().includes(query) || 
                             e.usuarioNome.toLowerCase().includes(query);
        const matchesStatus = statusFilter === '' || e.status === statusFilter;
        return matchesQuery && matchesStatus;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="py-4 text-center text-slate-400">Nenhum registro de empréstimo encontrado.</td></tr>`;
        return;
    }

    filtered.forEach(e => {
        const badge = e.status === 'Em Aberto' 
            ? `<span class="px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 rounded-full border border-amber-200">Em Aberto</span>`
            : `<span class="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200">Devolvido</span>`;

        const actionButton = e.status === 'Em Aberto' 
            ? `<button onclick="registrarDevolucao('${e.id}')" class="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ml-auto">
                <i data-lucide="check" class="w-3.5 h-3.5"></i> Devolver
               </button>`
            : `<span class="text-xs text-slate-400 font-medium italic">Concluído</span>`;

        tbody.innerHTML += `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="py-3 px-4 font-semibold text-slate-800">${e.titulo}</td>
                <td class="py-3 px-4 text-slate-600">${e.autor}</td>
                <td class="py-3 px-4 text-slate-700 font-medium">${e.usuarioNome}</td>
                <td class="py-3 px-4 text-slate-500">${formatDate(e.dataEmprestimo)}</td>
                <td class="py-3 px-4 text-slate-500">${formatDate(e.dataDevolucao)}</td>
                <td class="py-3 px-4 text-center">${badge}</td>
                <td class="py-3 px-4 text-right">${actionButton}</td>
            </tr>
        `;
    });
    lucide.createIcons();
}

function registrarDevolucao(id) {
    const emp = emprestimos.find(e => e.id === id);
    if (emp) {
        emp.status = "Devolvido";
        saveState();
        renderEmprestimosTable();
        renderDashboard();
        showToast("Devolução registrada com sucesso!");
    }
}

// Utility Date Formatter
function formatDate(dateStr) {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
}

// Data Reset Utility
function resetDataModal() {
    if (confirm("Deseja restaurar os dados de exemplo originais? Todas as alterações serão redefinidas.")) {
        localStorage.removeItem('biblio_livros');
        localStorage.removeItem('biblio_usuarios');
        localStorage.removeItem('biblio_emprestimos');

        livros = [...INITIAL_LIVROS];
        usuarios = [...INITIAL_USUARIOS];
        emprestimos = [...INITIAL_EMPRESTIMOS];

        saveState();
        renderDashboard();
        renderLivrosTable();
        renderUsuariosTable();
        renderEmprestimosTable();
        populateEmprestimoDropdowns();

        showToast("Dados restaurados com sucesso!");
    }
}