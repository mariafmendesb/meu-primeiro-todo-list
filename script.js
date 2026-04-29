const dateDisplay = document.getElementById('currentDate');
const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
const today  = new Date();
dateDisplay.innerText = today.toLocaleDateString('pt-BR', options);
// 1. Seleção de Elementos (Tudo declarado uma única vez no topo)
const input = document.getElementById('taskInput');
const button = document.getElementById('addTaskBtn');
const list = document.getElementById('taskList');
const countDisplay = document.getElementById('count');
const clearBtn = document.getElementById('clearAll');

// 2. Eventos principais
document.addEventListener('DOMContentLoaded', getTasks);
button.addEventListener('click', addTask);

// Adicionar com a tecla Enter
input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});

// Botão Limpar Tudo
clearBtn.addEventListener('click', () => {
    if(confirm("Tem certeza que deseja apagar todas as tarefas?")) {
        list.innerHTML = '';
        localStorage.clear();
        updateCount();
    }
});

// 3. Funções de Lógica
function addTask() {
    const taskText = input.value;
    if (taskText.trim() === '') return;

    createTag(taskText);
    saveLocalTasks(taskText);
    
    // Chamando a atualização do contador
    updateCount();

    input.value = '';
    input.focus();
}

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
        removeLocalTasks(taskText);
        li.remove();
        // Chamando a atualização do contador ao excluir
        updateCount();
    });

    list.appendChild(li);
    // Atualiza ao carregar a página também
    updateCount();
}

function updateCount() {
    // querySelectorAll retorna uma lista de todos os 'li' dentro da 'list'
    const total = list.querySelectorAll('li').length;
    countDisplay.innerText = total;
}

// 4. Funções de Persistência (LocalStorage)
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