const input = document.getElementById('taskInput');
const dateInput = document.getElementById('taskDate');
const endDateInput = document.getElementById('taskEndDate');
const startTimeInput = document.getElementById('startTime');
const endTimeInput = document.getElementById('endTime');
const list = document.getElementById('taskList');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const themeBtn = document.getElementById('themeToggle');

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

document.addEventListener('DOMContentLoaded', () => {
    getTasks();
    renderCalendar();
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    document.getElementById('currentDate').innerText = new Date().toLocaleDateString('pt-BR', options);
});

themeBtn.addEventListener('click', () => document.body.classList.toggle('dark-mode'));

window.switchTab = function(tab) {
    document.getElementById('listView').style.display = 'none';
    document.getElementById('calendarView').style.display = 'none';
    document.getElementById(tab + 'View').style.display = 'block';
    
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tab + 'TabBtn').classList.add('active');
    
    if (tab === 'calendar') renderCalendar();
};

window.addTask = function() {
    const text = input.value.trim();
    const startDate = dateInput.value;
    const endDate = endDateInput.value;
    const startTime = startTimeInput.value;
    const endTime = endTimeInput.value;

    if (!text || !startDate) return alert("Preencha a tarefa e pelo menos a data de início!");

    let datesToSave = [startDate];
    if (endDate && endDate > startDate) {
        datesToSave = getDatesInRange(startDate, endDate);
    }

    datesToSave.forEach(date => {
        const task = { 
            text, 
            date, 
            startTime: startTime,
            endTime: endTime,
            completed: false, 
            id: Date.now() + Math.random()
        };
        saveLocalTasks(task);
    });

    list.innerHTML = '';
    getTasks();
    renderCalendar();
    
    input.value = ''; 
    dateInput.value = '';
    endDateInput.value = '';
    startTimeInput.value = '';
    endTimeInput.value = '';
    updateProgress();
};

function getDatesInRange(startStr, endStr) {
    const dates = [];
    let curr = new Date(startStr + 'T00:00:00');
    const end = new Date(endStr + 'T00:00:00');
    while (curr <= end) {
        dates.push(curr.toISOString().split('T')[0]);
        curr.setDate(curr.getDate() + 1);
    }
    return dates;
}

document.getElementById('addTaskBtn').onclick = window.addTask;

function createTag(task) {
    const li = document.createElement('li');
    let timeDisplay = "";
    if (task.startTime && task.endTime) {
        timeDisplay = ` 🕒 ${task.startTime} – ${task.endTime}`;
    } else if (task.startTime) {
        timeDisplay = ` 🕒 ${task.startTime}`;
    }
    
    li.innerHTML = `
        <div>
            <span class="task-text ${task.completed ? 'completed' : ''}" onclick="toggleTask(${task.id})">${task.text}</span>
            <br><small style="font-size:0.6rem; opacity:0.6;">📅 ${task.date}${timeDisplay}</small>
        </div>
        <button onclick="deleteTask(${task.id})" style="background:none; border:none; color:#b05a5a; cursor:pointer; font-size:0.6rem;">APAGAR</button>
    `;
    list.appendChild(li);
}

window.renderCalendar = function() {
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
};

window.showDayTasks = function(date) {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const dayTasks = tasks.filter(t => t.date === date);
    const popup = document.getElementById('dayTasksView');
    const dayList = document.getElementById('dayTaskList');
    
    const dateObj = new Date(date + 'T00:00:00');
    const dateFormatted = dateObj.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
    document.getElementById('selectedDayTitle').innerText = dateFormatted;

    dayList.innerHTML = dayTasks.map(t => {
        const hor = t.startTime ? ` 🕒 ${t.startTime}${t.endTime ? ' - ' + t.endTime : ''}` : "";
        return `<li class="${t.completed ? 'completed' : ''}">${t.text}${hor}</li>`;
    }).join('') || '<li>Nenhuma tarefa</li>';
    
    popup.style.display = 'block';
};

window.closeDayTasks = () => document.getElementById('dayTasksView').style.display = 'none';

window.changeMonth = (step) => { 
    currentMonth += step; 
    if(currentMonth < 0){ currentMonth = 11; currentYear--; } 
    else if(currentMonth > 11){ currentMonth = 0; currentYear++; } 
    renderCalendar(); 
};

window.toggleTask = function(id) {
    let ts = JSON.parse(localStorage.getItem('tasks'));
    ts.forEach(t => { if(t.id === id) t.completed = !t.completed });
    localStorage.setItem('tasks', JSON.stringify(ts));
    list.innerHTML = ''; getTasks(); renderCalendar();
};

window.deleteTask = function(id) {
    let ts = JSON.parse(localStorage.getItem('tasks'));
    localStorage.setItem('tasks', JSON.stringify(ts.filter(t => t.id !== id)));
    list.innerHTML = ''; getTasks(); renderCalendar();
};

function saveLocalTasks(t) {
    let ts = localStorage.getItem('tasks') ? JSON.parse(localStorage.getItem('tasks')) : [];
    ts.push(t); localStorage.setItem('tasks', JSON.stringify(ts));
}

function getTasks() {
    let ts = localStorage.getItem('tasks') ? JSON.parse(localStorage.getItem('tasks')) : [];
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = ts.filter(t => t.date === today);

    if (todayTasks.length === 0) {
        list.innerHTML = '<li style="justify-content:center; opacity:0.5;">Nenhuma tarefa para hoje ✨</li>';
    } else {
        todayTasks.forEach(t => createTag(t));
    }
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

document.getElementById('clearBtn').onclick = () => {
    const option = document.getElementById('clearOption').value;
    let ts = JSON.parse(localStorage.getItem('tasks')) || [];
    const now = new Date();
    
    // Formata a data de hoje para comparação (sem horas)
    const todayStr = now.toISOString().split('T')[0];
    
    if (!confirm(`Tem certeza que deseja limpar as tarefas de: ${option}?`)) return;

    if (option === 'all') {
        ts = [];
    } else {
        ts = ts.filter(task => {
            const taskDate = new Date(task.date + 'T00:00:00');
            
            if (option === 'today') {
                return task.date !== todayStr;
            }
            
            if (option === 'week') {
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(now.getDate() - 7);
                // Mantém o que for anterior a 7 dias atrás ou posterior a hoje
                return taskDate < oneWeekAgo || taskDate > now;
            }

            if (option === 'month') {
                // Mantém apenas o que NÃO for do mês/ano atual
                return taskDate.getMonth() !== now.getMonth() || taskDate.getFullYear() !== now.getFullYear();
            }

            return true;
        });
    }

    localStorage.setItem('tasks', JSON.stringify(ts));
    list.innerHTML = '';
    getTasks();
    renderCalendar();
};