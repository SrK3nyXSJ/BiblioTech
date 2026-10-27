// =====================================================
// CONFIGURAÇÃO DO SUPABASE
// =====================================================

const SUPABASE_URL = "https://cphxdsxoneevbgibvczu.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_EPOB5Yn4haqqNJVTn9ISFA_g7nMCdML";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


// =====================================================
// CONTROLE DAS SEÇÕES & NAVEGAÇÃO
// =====================================================

function mostrarSecao(secao) {
    // Esconde todas as seções
    const secoes = ["inicio", "livros", "usuarios", "emprestimos"];
    secoes.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
    });

    // Mostra somente a seção escolhida
    const secaoAtiva = document.getElementById(secao);
    if (secaoAtiva) {
        secaoAtiva.style.display = "block";
    }

    // Atualiza classe ativa na sidebar
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    const btnAtivo = document.getElementById(`nav-${secao}`);
    if (btnAtivo) {
        btnAtivo.classList.add('active');
    }

    // Atualiza título do cabeçalho
    const titulos = {
        inicio: "Boas-vindas à Biblioteca",
        livros: "Gestão do Acervo de Livros",
        usuarios: "Cadastro de Usuários e Leitores",
        emprestimos: "Registro e Controle de Empréstimos"
    };

    document.getElementById("pageTitle").textContent = titulos[secao] || "Biblioteca";

    // Fecha a sidebar no celular ao escolher uma opção
    fecharSidebarMobile();
}

// Funções para controle da Sidebar Mobile
function abrirSidebarMobile() {
    document.getElementById("sidebar").classList.add("open");
    document.getElementById("sidebarOverlay").classList.add("active");
}

function fecharSidebarMobile() {
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("sidebarOverlay").classList.remove("active");
}

// Inicia na tela Inicial (Boas-vindas)
mostrarSecao("inicio");


// =====================================================
// LIVROS
// =====================================================

async function carregarLivros() {
    const { data, error } = await supabaseClient
        .from("livros")
        .select("*")
        .order("titulo", { ascending: true });

    if (error) {
        console.error("Erro ao carregar livros:", error);
        document.getElementById("listaLivros").innerHTML = `
            <p class="mensagem">Erro ao carregar os livros.</p>
        `;
        return;
    }

    const lista = document.getElementById("listaLivros");
    lista.innerHTML = "";

    if (!data || data.length === 0) {
        lista.innerHTML = `
            <p class="mensagem-vazia">Nenhum livro cadastrado no acervo.</p>
        `;
    } else {
        data.forEach(livro => {
            const card = document.createElement("div");
            card.className = "card";

            const status = livro.disponivel
                ? `<span class="status-disponivel">Disponível</span>`
                : `<span class="status-emprestado">Emprestado</span>`;

            card.innerHTML = `
                <h4>📖 ${livro.titulo}</h4>
                <p><strong>Autor:</strong> ${livro.autor}</p>
                <p><strong>Ano:</strong> ${livro.ano || "Não informado"}</p>
                <p><strong>Status:</strong> ${status}</p>
                ${
                    livro.disponivel
                    ? `<button class="btn-excluir" onclick="excluirLivro(${livro.id})">Excluir livro</button>`
                    : `<small style="color: var(--text-muted); margin-top:8px;">O livro está emprestado e não pode ser excluído.</small>`
                }
            `;
            lista.appendChild(card);
        });
    }

    atualizarSelectLivros(data || []);
}


// =====================================================
// CADASTRAR LIVRO
// =====================================================

document.getElementById("formLivro").addEventListener("submit", async function(event) {
    event.preventDefault();

    const titulo = document.getElementById("titulo").value.trim();
    const autor = document.getElementById("autor").value.trim();
    const ano = document.getElementById("ano").value;

    if (!titulo || !autor) {
        alert("Informe o título e o autor.");
        return;
    }

    const { error } = await supabaseClient
        .from("livros")
        .insert({
            titulo: titulo,
            autor: autor,
            ano: ano ? Number(ano) : null,
            disponivel: true
        });

    if (error) {
        console.error("Erro ao cadastrar livro:", error);
        alert("Erro ao cadastrar o livro.");
        return;
    }

    alert("Livro cadastrado com sucesso!");
    this.reset();
    carregarLivros();
});


// =====================================================
// EXCLUIR LIVRO
// =====================================================

async function excluirLivro(id) {
    if (!confirm("Deseja realmente excluir este livro?")) return;

    const { data: emprestimos, error: erroBusca } = await supabaseClient
        .from("emprestimos")
        .select("id")
        .eq("livro_id", id);

    if (erroBusca) {
        console.error(erroBusca);
        alert("Não foi possível verificar os empréstimos.");
        return;
    }

    if (emprestimos && emprestimos.length > 0) {
        alert("Este livro possui histórico de empréstimos e não pode ser excluído.");
        return;
    }

    const { error } = await supabaseClient
        .from("livros")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Erro ao excluir livro:", error);
        alert("Não foi possível excluir o livro.");
        return;
    }

    alert("Livro excluído com sucesso!");
    carregarLivros();
}


// =====================================================
// USUÁRIOS
// =====================================================

async function carregarUsuarios() {
    const { data, error } = await supabaseClient
        .from("usuarios")
        .select("*")
        .order("nome", { ascending: true });

    if (error) {
        console.error("Erro ao carregar usuários:", error);
        document.getElementById("listaUsuarios").innerHTML = `
            <p class="mensagem">Erro ao carregar os usuários.</p>
        `;
        return;
    }

    const lista = document.getElementById("listaUsuarios");
    lista.innerHTML = "";

    if (!data || data.length === 0) {
        lista.innerHTML = `
            <p class="mensagem-vazia">Nenhum usuário cadastrado.</p>
        `;
    } else {
        data.forEach(usuario => {
            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = `
                <h4>👤 ${usuario.nome}</h4>
                <p><strong>E-mail:</strong> ${usuario.email || "Não informado"}</p>
                <button class="btn-excluir" onclick="excluirUsuario(${usuario.id})">
                    Excluir usuário
                </button>
            `;
            lista.appendChild(card);
        });
    }

    atualizarSelectUsuarios(data || []);
}


// =====================================================
// CADASTRAR USUÁRIO
// =====================================================

document.getElementById("formUsuario").addEventListener("submit", async function(event) {
    event.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();

    if (!nome) {
        alert("Informe o nome do usuário.");
        return;
    }

    const { error } = await supabaseClient
        .from("usuarios")
        .insert({
            nome: nome,
            email: email || null
        });

    if (error) {
        console.error("Erro ao cadastrar usuário:", error);
        alert("Erro ao cadastrar usuário.");
        return;
    }

    alert("Usuário cadastrado com sucesso!");
    this.reset();
    carregarUsuarios();
});


// =====================================================
// EXCLUIR USUÁRIO
// =====================================================

async function excluirUsuario(id) {
    if (!confirm("Deseja realmente excluir este usuário?")) return;

    const { data: emprestimos, error: erroBusca } = await supabaseClient
        .from("emprestimos")
        .select("id")
        .eq("usuario_id", id);

    if (erroBusca) {
        console.error(erroBusca);
        alert("Não foi possível verificar os empréstimos.");
        return;
    }

    if (emprestimos && emprestimos.length > 0) {
        alert("Este usuário possui histórico de empréstimos e não pode ser excluído.");
        return;
    }

    const { error } = await supabaseClient
        .from("usuarios")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Erro ao excluir usuário:", error);
        alert("Não foi possível excluir o usuário.");
        return;
    }

    alert("Usuário excluído com sucesso!");
    carregarUsuarios();
}


// =====================================================
// SELECT DE LIVROS E USUÁRIOS
// =====================================================

function atualizarSelectLivros(livros) {
    const select = document.getElementById("livroEmprestimo");
    select.innerHTML = `<option value="">Selecione um livro...</option>`;

    livros
        .filter(livro => livro.disponivel === true)
        .forEach(livro => {
            const option = document.createElement("option");
            option.value = livro.id;
            option.textContent = `${livro.titulo} — ${livro.autor}`;
            select.appendChild(option);
        });
}

function atualizarSelectUsuarios(usuarios) {
    const select = document.getElementById("usuarioEmprestimo");
    select.innerHTML = `<option value="">Selecione um usuário...</option>`;

    usuarios.forEach(usuario => {
        const option = document.createElement("option");
        option.value = usuario.id;
        option.textContent = usuario.nome;
        select.appendChild(option);
    });
}


// =====================================================
// REGISTRAR EMPRÉSTIMO
// =====================================================

document.getElementById("formEmprestimo").addEventListener("submit", async function(event) {
    event.preventDefault();

    const livroId = Number(document.getElementById("livroEmprestimo").value);
    const usuarioId = Number(document.getElementById("usuarioEmprestimo").value);

    if (!livroId || !usuarioId) {
        alert("Selecione o livro e o usuário.");
        return;
    }

    const { data: livro, error: erroLivro } = await supabaseClient
        .from("livros")
        .select("id, titulo, disponivel")
        .eq("id", livroId)
        .single();

    if (erroLivro || !livro) {
        alert("Livro não encontrado.");
        return;
    }

    if (!livro.disponivel) {
        alert("Este livro já está emprestado.");
        carregarLivros();
        return;
    }

    const { data: usuario, error: erroUsuario } = await supabaseClient
        .from("usuarios")
        .select("id")
        .eq("id", usuarioId)
        .single();

    if (erroUsuario || !usuario) {
        alert("Usuário não encontrado.");
        return;
    }

    const { error: erroEmprestimo } = await supabaseClient
        .from("emprestimos")
        .insert({
            livro_id: livroId,
            usuario_id: usuarioId,
            data_emprestimo: new Date().toISOString().split("T")[0],
            devolvido: false
        });

    if (erroEmprestimo) {
        console.error("Erro ao registrar empréstimo:", erroEmprestimo);
        alert("Erro ao registrar empréstimo.");
        return;
    }

    const { error: erroAtualizacao } = await supabaseClient
        .from("livros")
        .update({ disponivel: false })
        .eq("id", livroId);

    if (erroAtualizacao) {
        alert("O empréstimo foi registrado, mas houve erro ao atualizar a disponibilidade do livro.");
        return;
    }

    alert("Empréstimo registrado com sucesso!");
    this.reset();
    carregarLivros();
    carregarEmprestimos();
});


// =====================================================
// CARREGAR EMPRÉSTIMOS
// =====================================================

async function carregarEmprestimos() {
    const { data, error } = await supabaseClient
        .from("emprestimos")
        .select(`
            id,
            livro_id,
            usuario_id,
            data_emprestimo,
            data_devolucao,
            devolvido,
            livros ( titulo, autor ),
            usuarios ( nome, email )
        `)
        .order("data_emprestimo", { ascending: false });

    if (error) {
        console.error("Erro ao carregar empréstimos:", error);
        document.getElementById("listaEmprestimos").innerHTML = `
            <p class="mensagem">Erro ao carregar empréstimos.</p>
        `;
        return;
    }

    const lista = document.getElementById("listaEmprestimos");
    lista.innerHTML = "";

    if (!data || data.length === 0) {
        lista.innerHTML = `
            <p class="mensagem-vazia">Nenhum empréstimo registrado.</p>
        `;
        return;
    }

    data.forEach(emprestimo => {
        const card = document.createElement("div");
        card.className = "card";

        const status = emprestimo.devolvido
            ? `<span class="status-devolvido">Devolvido</span>`
            : `<span class="status-emprestado">Em aberto</span>`;

        const botaoDevolucao = !emprestimo.devolvido
            ? `<button class="btn-devolver" onclick="devolverLivro(${emprestimo.id}, ${emprestimo.livro_id})">Registrar devolução</button>`
            : "";

        card.innerHTML = `
            <h4>📖 ${emprestimo.livros ? emprestimo.livros.titulo : 'Livro não encontrado'}</h4>
            <p><strong>Autor:</strong> ${emprestimo.livros ? emprestimo.livros.autor : '-'}</p>
            <p><strong>Usuário:</strong> ${emprestimo.usuarios ? emprestimo.usuarios.nome : '-'}</p>
            <p><strong>Data do empréstimo:</strong> ${formatarData(emprestimo.data_emprestimo)}</p>
            <p><strong>Data da devolução:</strong> ${emprestimo.data_devolucao ? formatarData(emprestimo.data_devolucao) : "Ainda não devolvido"}</p>
            <p><strong>Status:</strong> ${status}</p>
            ${botaoDevolucao}
        `;

        lista.appendChild(card);
    });
}


// =====================================================
// REGISTRAR DEVOLUÇÃO
// =====================================================

async function devolverLivro(emprestimoId, livroId) {
    if (!confirm("Deseja registrar a devolução deste livro?")) return;

    const { error: erroEmprestimo } = await supabaseClient
        .from("emprestimos")
        .update({
            devolvido: true,
            data_devolucao: new Date().toISOString().split("T")[0]
        })
        .eq("id", emprestimoId);

    if (erroEmprestimo) {
        console.error("Erro ao registrar devolução:", erroEmprestimo);
        alert("Erro ao registrar devolução.");
        return;
    }

    const { error: erroLivro } = await supabaseClient
        .from("livros")
        .update({ disponivel: true })
        .eq("id", livroId);

    if (erroLivro) {
        alert("A devolução foi registrada, mas houve erro ao atualizar a disponibilidade.");
        return;
    }

    alert("Devolução registrada com sucesso!");
    carregarLivros();
    carregarEmprestimos();
}


// =====================================================
// FORMATAR DATA
// =====================================================

function formatarData(data) {
    if (!data) return "Não informado";
    const partes = data.split("-");
    if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return data;
}


// =====================================================
// INICIALIZAÇÃO DO SISTEMA
// =====================================================

carregarLivros();
carregarUsuarios();
carregarEmprestimos();