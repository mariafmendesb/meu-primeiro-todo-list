const input = document.getElementById('taskInput');
const button = document.getElementById('addTaskBtn');
const list = document.getElementById('taskList');

// --- NOVO: Carregar tarefas ao abrir a página ---
document.addEventListener('DOMContentLoaded', getTasks);

button.addEventListener('click', addTask);

function addTask() {
    const taskText = input.value;
    if (taskText.trim() === '') return;

    createTag(taskText);
    
    // --- NOVO: Salvar no LocalStorage ---
    saveLocalTasks(taskText);

    input.value = '';
    input.focus();
}

// Função auxiliar para criar o HTML da tarefa
function createTag(taskText) {
    const li = document.createElement('li');
    li.innerHTML = `
        <span>${taskText}</span>
        <button class="delete-btn">Excluir</button>
    `;

    li.querySelector('span').addEventListener('click', function() {
        this.classList.toggle('completed');
    });

    li.querySelector('.delete-btn').addEventListener('click', function() {
        removeLocalTasks(taskText); // Remove do storage
        li.remove();
    });

    list.appendChild(li);
}

// --- FUNÇÕES DE PERSISTÊNCIA (O "Banco de Dados") ---

function saveLocalTasks(task) {
    let tasks;
    // Verifica se já existe algo no "banco"
    if (localStorage.getItem('tasks') === null) {
        tasks = [];
    } else {
        tasks = JSON.parse(localStorage.getItem('tasks'));
    }
    tasks.push(task);
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function getTasks() {
    let tasks;
    if (localStorage.getItem('tasks') === null) {
        tasks = [];
    } else {
        tasks = JSON.parse(localStorage.getItem('tasks'));
    }
    tasks.forEach(function(task) {
        createTag(task);
    });
}

function removeLocalTasks(task) {
    let tasks = JSON.parse(localStorage.getItem('tasks'));
    // Filtra a lista removendo o item que tem o mesmo texto
    const filteredTasks = tasks.filter(t => t !== task);
    localStorage.setItem('tasks', JSON.stringify(filteredTasks));
}