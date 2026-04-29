const input = document.getElementById('taskInput');
const dateInput = document.getElementById('taskDate');
const durationInput = document.getElementById('taskDuration');
const list = document.getElementById('taskList');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const themeBtn = document.getElementById('themeToggle');

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    getTasks();
    renderCalendar(); // Renderiza o calendário em segundo plano
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    document.getElementById('currentDate').innerText = new Date().toLocaleDateString('pt-BR', options);
});

themeBtn.addEventListener('click', () => document.body.classList.toggle('dark-mode'));

// NAVEGAÇÃO DE ABAS
window.switchTab = function(tab) {
    document.getElementById('listView').style.display = 'none';
    document.getElementById('calendarView').style.display = 'none';
    
    document.getElementById(tab + 'View').style.display = 'block';
    
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tab + 'TabBtn').classList.add('active');
    
    if (tab === 'calendar') {
        renderCalendar();
    }
};

// ADICIONAR TAREFA
function addTask() {
    const text = input.value.trim();
    const date = dateInput.value;
    const duration = durationInput.value.trim();
    if (!text || !date) return alert("Preencha a tarefa e a data!");

    const task = { text, date, duration, completed: false, id: Date.now() };
    saveLocalTasks(task);
    
    // Atualiza a interface sem recarregar a página
    list.innerHTML = '';
    getTasks();
    
    input.value = ''; dateInput.value = ''; durationInput.value = '';
    updateProgress();
}

document.getElementById('addTaskBtn').onclick = addTask;

function createTag(task) {
    const li = document.createElement('li');
    li.innerHTML = `
        <div>
            <span class="task-text ${task.completed ? 'completed' : ''}" onclick="toggleTask(${task.id})">${task.text}</span>
            <br><small style="font-size:0.6rem; opacity:0.6;">📅 ${task.date} | ⏳ ${task.duration || 'N/A'}</small>
        </div>
        <button onclick="deleteTask(${task.id})" style="background:none; border:none; color:#b05a5a; cursor:pointer; font-size:0.6rem;">APAGAR</button>
    `;
    list.appendChild(li);
}

// CALENDÁRIO
window.changeMonth = function(step) {
    currentMonth += step;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    renderCalendar();
};

function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const monthDisplay = document.getElementById('monthDisplay');
    if (!grid || !monthDisplay) return;
    
    grid.innerHTML = '';
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    monthDisplay.innerText = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(currentYear, currentMonth));

    for (let i = 0; i < firstDay; i++) grid.innerHTML += '<div></div>';

    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayTasks = tasks.filter(t => t.date === dateStr);
        
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        
        if (dayTasks.length > 0) {
            const allDone = dayTasks.every(t => t.completed);
            dayEl.classList.add(allDone ? 'has-completed' : 'has-open');
            
            const badge = document.createElement('span');
            badge.className = 'task-count-badge';
            badge.innerText = dayTasks.length;
            dayEl.appendChild(badge);
        }

        const dayNumber = document.createElement('span');
        dayNumber.innerText = d;
        dayEl.appendChild(dayNumber);

        dayEl.onclick = () => showDayTasks(dateStr);
        grid.appendChild(dayEl);
    }
}

window.showDayTasks = function(date) {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const dayTasks = tasks.filter(t => t.date === date);
    const popup = document.getElementById('dayTasksView');
    const dayList = document.getElementById('dayTaskList');
    
    // Formata a data para ficar bonita no título do popup
    const dateObj = new Date(date + 'T00:00:00');
    const dateFormatted = dateObj.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
    
    document.getElementById('selectedDayTitle').innerText = dateFormatted;

    // Limpa e preenche a lista
    dayList.innerHTML = dayTasks.map(t => {
        // LÓGICA: Só mostra a duração se ela não estiver vazia
        const durationText = t.duration ? ` — ⏳ ${t.duration}` : "";
        return `<li class="${t.completed ? 'completed' : ''}">${t.text}${durationText}</li>`;
    }).join('') || '<li>Nenhuma tarefa para este dia</li>';
    
    popup.style.display = 'block';
};

window.closeDayTasks = function() { 
    document.getElementById('dayTasksView').style.display = 'none'; 
};

// AUXILIARES (LÓGICA DE DADOS)
window.toggleTask = function(id) {
    let ts = JSON.parse(localStorage.getItem('tasks'));
    ts.forEach(t => { if(t.id === id) t.completed = !t.completed });
    localStorage.setItem('tasks', JSON.stringify(ts));
    
    // Atualiza as listas sem dar reload
    list.innerHTML = '';
    getTasks();
    renderCalendar();
};

window.deleteTask = function(id) {
    let ts = JSON.parse(localStorage.getItem('tasks'));
    localStorage.setItem('tasks', JSON.stringify(ts.filter(t => t.id !== id)));
    
    list.innerHTML = '';
    getTasks();
    renderCalendar();
};

function saveLocalTasks(t) {
    let ts = localStorage.getItem('tasks') ? JSON.parse(localStorage.getItem('tasks')) : [];
    ts.push(t);
    localStorage.setItem('tasks', JSON.stringify(ts));
}

function getTasks() {
    let ts = localStorage.getItem('tasks') ? JSON.parse(localStorage.getItem('tasks')) : [];
    ts.forEach(t => createTag(t));
    updateProgress();
}

function updateProgress() {
    const ts = JSON.parse(localStorage.getItem('tasks')) || [];
    const done = ts.filter(t => t.completed).length;
    const perc = ts.length ? Math.round((done / ts.length) * 100) : 0;
    progressBar.style.width = perc + '%';
    progressText.innerText = perc + '% concluído';
    document.getElementById('countDisplay').innerText = ts.length + ' tarefas';
}

document.getElementById('clearAll').onclick = () => { 
    if(confirm("Apagar tudo?")) { 
        localStorage.clear(); 
        list.innerHTML = '';
        updateProgress();
        renderCalendar();
    }
};