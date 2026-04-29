// 1. Seleção de Elementos
const input = document.getElementById('taskInput');
const button = document.getElementById('addTaskBtn');
const list = document.getElementById('taskList');
const countDisplay = document.getElementById('count');
const clearBtn = document.getElementById('clearAll');
const themeBtn = document.getElementById('themeToggle');
const dateDisplay = document.getElementById('currentDate');

// 2. Data Atual
const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
const today = new Date();
if(dateDisplay) dateDisplay.innerText = today.toLocaleDateString('pt-BR', options);

// 3. Eventos
document.addEventListener('DOMContentLoaded', getTasks);
button.addEventListener('click', addTask);

input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});

themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    themeBtn.innerText = document.body.classList.contains('dark-mode') ? '☀️' : '🌓';
});

clearBtn.addEventListener('click', () => {
    if(confirm("Deseja apagar tudo?")) {
        list.innerHTML = '';
        localStorage.clear();
        updateCount();
    }
});

// 4. Funções
function addTask() {
    const taskText = input.value;
    if (taskText.trim() === '') return;
    createTag(taskText);
    saveLocalTasks(taskText);
    updateCount();
    input.value = '';
    input.focus();
}

function createTag(taskText) {
    const li = document.createElement('li');
    
    // Criamos uma estrutura que facilita a edição
    li.innerHTML = `
        <span class="task-text">${taskText}</span>
        <div class="actions">
            <button class="edit-btn">Editar</button>
            <button class="delete-btn">Excluir</button>
        </div>
    `;

    const span = li.querySelector('.task-text');
    const editBtn = li.querySelector('.edit-btn');
    const deleteBtn = li.querySelector('.delete-btn');

    // Função de Marcar como Concluída
    span.addEventListener('click', function() {
        this.classList.toggle('completed');
    });

    // --- LÓGICA DE EDIÇÃO ---
    editBtn.addEventListener('click', function() {
        if (editBtn.innerText === 'Editar') {
            // Entrar no modo de edição
            const currentText = span.innerText;
            span.innerHTML = `<input type="text" class="edit-input" value="${currentText}">`;
            const inputEdit = span.querySelector('input');
            inputEdit.focus();
            editBtn.innerText = 'Salvar';
            editBtn.style.color = '#28a745'; // Fica verde ao editar
        } else {
            // Salvar a edição
            const inputEdit = span.querySelector('input');
            const newText = inputEdit.value;
            
            if (newText.trim() !== "") {
                const oldText = taskText; // Guardamos o texto antigo para atualizar o Storage
                span.innerText = newText;
                editBtn.innerText = 'Editar';
                editBtn.style.color = ''; // Volta ao padrão
                
                // Atualizar no "Banco de Dados" (LocalStorage)
                updateLocalTask(oldText, newText);
                taskText = newText; // Atualiza a variável local para futuras edições
            }
        }
    });

    // Função de Excluir
    deleteBtn.addEventListener('click', function() {
        removeLocalTasks(taskText);
        li.remove();
        updateCount();
    });

    list.appendChild(li);
    updateCount();
}

function updateCount() {
    const total = list.querySelectorAll('li').length;
    if(countDisplay) countDisplay.innerText = total;
}

// 5. LocalStorage
function saveLocalTasks(task) {
    let tasks = localStorage.getItem('tasks') === null ? [] : JSON.parse(localStorage.getItem('tasks'));
    tasks.push(task);
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function getTasks() {
    let tasks = localStorage.getItem('tasks') === null ? [] : JSON.parse(localStorage.getItem('tasks'));
    tasks.forEach(task => createTag(task));
}

function removeLocalTasks(task) {
    let tasks = JSON.parse(localStorage.getItem('tasks'));
    const filteredTasks = tasks.filter(t => t !== task);
    localStorage.setItem('tasks', JSON.stringify(filteredTasks));
}

function filterTasks(type) {
    const allTasks = list.querySelectorAll('li');
    
    // Atualiza qual botão está "ativo" visualmente
    document.querySelectorAll('.filters button').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    allTasks.forEach(li => {
        const isCompleted = li.querySelector('span').classList.contains('completed');
        switch(type) {
            case 'all':
                li.style.display = 'flex';
                break;
            case 'pending':
                li.style.display = isCompleted ? 'none' : 'flex';
                break;
            case 'completed':
                li.style.display = isCompleted ? 'flex' : 'none';
                break;
        }
    });
}

function updateLocalTask(oldText, newText) {
    let tasks = JSON.parse(localStorage.getItem('tasks'));
    const index = tasks.indexOf(oldText);
    if (index !== -1) {
        tasks[index] = newText;
    }
    localStorage.setItem('tasks', JSON.stringify(tasks));
}