// === SELETORES GLOBAIS ===
const input = document.getElementById('taskInput');
const dateInput = document.getElementById('taskDate');
const startTimeInput = document.getElementById('startTime');
const categoryInput = document.getElementById('taskCategory');
const list = document.getElementById('taskList');

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let myChart = null;
let weeklyChart = null;
let isPriority = false;

// === INICIALIZAÇÃO ===
document.addEventListener('DOMContentLoaded', () => {
    getTasks();
    const dateOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const dateEl = document.getElementById('currentDate');
    if (dateEl) dateEl.innerText = new Date().toLocaleDateString('pt-BR', dateOptions);
    
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }
    
    fetchDailyQuote();
});

// === FRASE DO DIA (API) ===
async function fetchDailyQuote() {
    const quoteElement = document.getElementById('dailyQuote');
    if (!quoteElement) return;
    try {
        const response = await fetch('https://dummyjson.com/quotes/random');
        const data = await response.json();
        quoteElement.innerText = `"${data.quote}" — ${data.author}`;
    } catch (error) {
        quoteElement.innerText = '"Breathe in, breathe out. You got this."';
    }
}

// === TEMA (DARK MODE) ===
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
    themeToggle.onclick = () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        document.getElementById('themeIcon').className = isDark ? 'ph ph-sun' : 'ph ph-moon-stars';
        
        if (document.getElementById('statsView') && document.getElementById('statsView').style.display === 'flex') {
            renderStats();
        }
    };
}

// === NAVEGAÇÃO ENTRE ABAS E MINI TIMER ===
window.showTab = function(tabId) {
    const views = ['listView', 'calendarView', 'habitView', 'statsView', 'pomodoroView'];
    
    views.forEach(v => {
        const el = document.getElementById(v);
        if(el) el.style.display = 'none';
    });

    document.querySelectorAll('.nav-tabs button').forEach(btn => btn.classList.remove('active'));

    const activeView = document.getElementById(tabId);
    if(activeView) activeView.style.display = 'flex';

    const activeBtn = document.getElementById('btn-' + tabId);
    if(activeBtn) activeBtn.classList.add('active');

    if (tabId === 'calendarView') renderCalendar();
    if (tabId === 'habitView') renderHabits();
    if (tabId === 'statsView') setTimeout(renderStats, 50);

    // Verifica se precisa mostrar o mini-timer
    checkMiniTimer(tabId);
};

// Nova Função: Controla a visibilidade do Mini Timer
function checkMiniTimer(currentTabId) {
    const miniTimerEl = document.getElementById('miniTimer');
    if (!miniTimerEl) return;

    // Se o timer estiver rodando E a aba atual não for o pomodoro, mostre a bolha
    if (timer !== null && currentTabId !== 'pomodoroView') {
        miniTimerEl.classList.add('visible');
    } else {
        miniTimerEl.classList.remove('visible');
    }
}

// === GESTÃO DE TAREFAS (CRUD + PRIORIDADE + PROGRESSO) ===
const priorityBtn = document.getElementById('priorityToggleBtn');
if (priorityBtn) {
    priorityBtn.onclick = () => {
        isPriority = !isPriority;
        priorityBtn.classList.toggle('active', isPriority);
        priorityBtn.innerHTML = isPriority ? '<i class="ph-fill ph-flag"></i>' : '<i class="ph ph-flag"></i>';
    };
}

window.addTask = function() {
    if (!input.value || !dateInput.value) return alert("Preencha a tarefa e a data!");
    
    const task = { 
        text: input.value, 
        date: dateInput.value, 
        startTime: startTimeInput.value, 
        category: categoryInput.value, 
        priority: isPriority,
        completed: false, 
        id: Date.now(), 
        notified: false 
    };
    
    let ts = JSON.parse(localStorage.getItem('tasks')) || [];
    ts.push(task);
    localStorage.setItem('tasks', JSON.stringify(ts));
    
    input.value = '';
    isPriority = false;
    if (priorityBtn) {
        priorityBtn.classList.remove('active');
        priorityBtn.innerHTML = '<i class="ph ph-flag"></i>';
    }
    
    getTasks();
};

const addTaskBtn = document.getElementById('addTaskBtn');
if (addTaskBtn) addTaskBtn.onclick = window.addTask;

function getTasks() {
    if (!list) return;
    list.innerHTML = '';
    let ts = JSON.parse(localStorage.getItem('tasks')) || [];
    const todayStr = new Date().toISOString().split('T')[0];

    const overdueTasks = ts.filter(t => t.date < todayStr && !t.completed);
    let todayTasks = ts.filter(t => t.date === todayStr);

    todayTasks.sort((a, b) => (b.priority === true ? 1 : 0) - (a.priority === true ? 1 : 0));

    if (overdueTasks.length > 0) {
        const header = document.createElement('p');
        header.className = 'list-section-title';
        header.innerText = "Pendências de dias anteriores";
        list.appendChild(header);
        overdueTasks.forEach(t => createTag(t, true));
        const spacer = document.createElement('hr');
        spacer.className = 'list-spacer';
        list.appendChild(spacer);
    }

    const todayHeader = document.createElement('p');
    todayHeader.className = 'list-section-title';
    todayHeader.innerText = "Para hoje";
    list.appendChild(todayHeader);
    
    if (todayTasks.length > 0) {
        const completedToday = todayTasks.filter(t => t.completed).length;
        const progressPercent = Math.round((completedToday / todayTasks.length) * 100);

        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-container';
        progressContainer.innerHTML = `<div class="progress-bar" style="width: ${progressPercent}%;"></div>`;
        list.appendChild(progressContainer);

        const progressText = document.createElement('div');
        progressText.className = 'progress-text';
        progressText.innerText = `${progressPercent}% concluído`;
        list.appendChild(progressText);

        todayTasks.forEach(t => createTag(t, false));
    } else {
        const empty = document.createElement('li');
        empty.style.border = "none";
        empty.style.justifyContent = "center";
        empty.style.opacity = "0.5";
        empty.innerText = "Nada planejado para hoje.";
        list.appendChild(empty);
    }

    const countDisplay = document.getElementById('countDisplay');
    if (countDisplay) countDisplay.innerText = `${overdueTasks.length + todayTasks.length} tarefas visíveis`;
}

function createTag(task, showDate = false) {
    const li = document.createElement('li');
    li.className = `cat-${task.category.toLowerCase()}`;
    const dateParts = task.date.split('-');
    const formattedDate = `${dateParts[2]}/${dateParts[1]}`;

    li.innerHTML = `
        <div style="flex:1; cursor:pointer;" onclick="toggleTask(${task.id})">
            <span class="task-text ${task.completed ? 'completed' : ''}">${task.text}</span>
            <br>
            <small style="opacity:0.6; font-size: 0.7rem; display: flex; align-items: center; gap: 4px; margin-top: 4px;">
                🕒 ${task.startTime || '--:--'} 
                ${task.priority ? '<i class="ph-fill ph-flag" style="color: var(--accent-red);"></i>' : ''}
                ${showDate ? `<span class="overdue-label">📅 ${formattedDate}</span>` : ''}
            </small>
        </div>
        <div style="display:flex; align-items:center;">
            <button onclick="event.stopPropagation(); editTask(${task.id})" style="background:none;border:none;cursor:pointer;margin-right:12px;font-size:1rem;"><i class="ph ph-pencil-simple"></i></button>
            <button onclick="event.stopPropagation(); deleteTask(${task.id})" style="background:none;border:none;cursor:pointer;color:var(--accent-red);font-size:1rem;"><i class="ph ph-trash"></i></button>
        </div>
    `;
    list.appendChild(li);
}

window.toggleTask = id => {
    let ts = JSON.parse(localStorage.getItem('tasks'));
    ts.map(t => { if(t.id === id) t.completed = !t.completed });
    localStorage.setItem('tasks', JSON.stringify(ts));
    getTasks();
};

window.deleteTask = id => {
    let ts = JSON.parse(localStorage.getItem('tasks'));
    localStorage.setItem('tasks', JSON.stringify(ts.filter(t => t.id !== id)));
    getTasks();
};

window.editTask = id => {
    let ts = JSON.parse(localStorage.getItem('tasks'));
    const t = ts.find(x => x.id === id);
    input.value = t.text; dateInput.value = t.date; startTimeInput.value = t.startTime; categoryInput.value = t.category; 
    
    isPriority = t.priority || false; 
    if (priorityBtn) {
        priorityBtn.classList.toggle('active', isPriority);
        priorityBtn.innerHTML = isPriority ? '<i class="ph-fill ph-flag"></i>' : '<i class="ph ph-flag"></i>';
    }
    
    deleteTask(id);
    window.showTab('listView');
};

const clearBtn = document.getElementById('clearBtn');
if (clearBtn) {
    clearBtn.onclick = () => {
        const opt = document.getElementById('clearOption').value;
        let ts = JSON.parse(localStorage.getItem('tasks')) || [];
        const now = new Date();
        if(!confirm("Deseja confirmar a limpeza?")) return;
        
        if(opt === 'all') ts = [];
        else if(opt === 'today') ts = ts.filter(t => t.date !== now.toISOString().split('T')[0]);
        else if(opt === 'week') { const oneWeekAgo = new Date(); oneWeekAgo.setDate(now.getDate() - 7); ts = ts.filter(t => new Date(t.date) < oneWeekAgo); }
        else if(opt === 'month') ts = ts.filter(t => new Date(t.date).getMonth() !== now.getMonth());
        
        localStorage.setItem('tasks', JSON.stringify(ts));
        getTasks();
    };
}

// === CALENDÁRIO ===
window.renderCalendar = () => {
    const grid = document.getElementById('calendarGrid');
    if(!grid) return;
    grid.innerHTML = '';
    const first = new Date(currentYear, currentMonth, 1).getDay(), days = new Date(currentYear, currentMonth + 1, 0).getDate();
    const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(currentYear, currentMonth));
    document.getElementById('monthDisplay').innerText = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    for(let i=0; i<first; i++) grid.appendChild(document.createElement('div'));
    const ts = JSON.parse(localStorage.getItem('tasks')) || [];
    for(let d=1; d<=days; d++) {
        const div = document.createElement('div'), dateStr = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        div.className = 'calendar-day'; div.innerText = d; 
        const dayTasks = ts.filter(t => t.date === dateStr);
        if (dayTasks.length > 0) div.classList.add(dayTasks.every(t => t.completed) ? 'has-completed' : 'has-open');
        div.onclick = () => window.openDayPopup(dateStr, d);
        grid.appendChild(div);
    }
};
window.changeMonth = s => { currentMonth += s; renderCalendar(); };

window.openDayPopup = function(dateStr, dayNumber) {
    const ts = JSON.parse(localStorage.getItem('tasks')) || [], dayTasks = ts.filter(t => t.date === dateStr), listEl = document.getElementById('dayTasksList'), titleEl = document.getElementById('selectedDateTitle');
    if(!listEl || !titleEl) return;
    titleEl.innerText = `${dayNumber} de ${new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date(currentYear, currentMonth))}`;
    listEl.innerHTML = dayTasks.length === 0 ? '<li>Sem tarefas.</li>' : dayTasks.map(t => `<li class="${t.completed ? 'done' : ''}"><span>${t.completed ? '✓' : '•'} ${t.text}</span> <small>${t.startTime || ''}</small></li>`).join('');
    document.getElementById('dayTasksPopup').style.display = 'flex';
};
window.closeDayPopup = () => { const popup = document.getElementById('dayTasksPopup'); if(popup) popup.style.display = 'none'; };

// === DASHBOARD (INSIGHTS) ===
window.renderStats = () => {
    const ts = JSON.parse(localStorage.getItem('tasks')) || [];
    const isDark = document.body.classList.contains('dark-mode');
    const textColor = isDark ? '#cdd6f4' : '#4a3f35';
    const borderColor = isDark ? '#1e1e2e' : '#f5ebe0';

    const counts = { Personal: 0, Work: 0, Study: 0, Health: 0 };
    ts.forEach(t => { if(counts[t.category] !== undefined) counts[t.category]++; });
    
    const chartCanvas = document.getElementById('categoryChart');
    if (chartCanvas) {
        const ctxCat = chartCanvas.getContext('2d');
        if(myChart) myChart.destroy();
        myChart = new Chart(ctxCat, {
            type: 'doughnut',
            data: { labels: Object.keys(counts), datasets: [{ data: Object.values(counts), backgroundColor: isDark ? ['#f2cdcd', '#89b4fa', '#cba6f7', '#a6e3a1'] : ['#ffcfd2', '#a2d2ff', '#cfdbd5', '#b9fbc0'], borderWidth: 2, borderColor: borderColor }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    }

    const last7Days = []; const completedCounts = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        last7Days.push(d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.',''));
        completedCounts.push(ts.filter(t => t.date === dateStr && t.completed).length);
    }
    const weeklyCanvas = document.getElementById('weeklyChart');
    if (weeklyCanvas) {
        const ctxWeek = weeklyCanvas.getContext('2d');
        if(weeklyChart) weeklyChart.destroy();
        weeklyChart = new Chart(ctxWeek, {
            type: 'bar',
            data: { labels: last7Days, datasets: [{ data: completedCounts, backgroundColor: isDark ? '#89b4fa' : '#d5bdaf', borderRadius: 8 }] },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { color: textColor, stepSize: 1 } }, x: { ticks: { color: textColor } } }, plugins: { legend: { display: false } } }
        });
    }
};

// === HABIT TRACKER DINÂMICO ===
function getIconForHabit(name) {
    const text = name.toLowerCase();
    if (text.includes('água') || text.includes('beber')) return '<i class="ph ph-drop"></i>';
    if (text.includes('ler') || text.includes('livro')) return '<i class="ph ph-book-open"></i>';
    if (text.includes('estudar') || text.includes('código')) return '<i class="ph ph-laptop"></i>';
    if (text.includes('treino') || text.includes('academia')) return '<i class="ph ph-barbell"></i>';
    return '<i class="ph ph-sparkle"></i>'; 
}

window.renderHabits = function() {
    const container = document.getElementById('habitList');
    if(!container) return;
    const today = new Date().toISOString().split('T')[0];
    let habitData = JSON.parse(localStorage.getItem('habitTracker')) || { date: today, states: {} };
    if (habitData.date !== today) { habitData = { date: today, states: {} }; localStorage.setItem('habitTracker', JSON.stringify(habitData)); }
    container.innerHTML = '';
    const habits = JSON.parse(localStorage.getItem('myCustomHabits')) || [];
    habits.forEach(habit => {
        const isDone = habitData.states[habit.id] || false;
        const div = document.createElement('div');
        div.className = `habit-item ${isDone ? 'done' : ''}`;
        div.innerHTML = `<div style="display:flex;align-items:center;flex:1;gap:8px" onclick="toggleHabit('${habit.id}')"><span>${habit.icon}</span><span>${habit.name}</span></div><button onclick="event.stopPropagation();deleteHabit('${habit.id}')" class="habit-btn delete"><i class="ph ph-trash"></i></button><div class="habit-check" onclick="toggleHabit('${habit.id}')"><i class="ph ph-check-bold"></i></div>`;
        container.appendChild(div);
    });
};

window.addHabit = function() {
    const nameInput = document.getElementById('habitNameInput');
    if (!nameInput || !nameInput.value) return;
    const habits = JSON.parse(localStorage.getItem('myCustomHabits')) || [];
    habits.push({ id: 'h_' + Date.now(), icon: getIconForHabit(nameInput.value), name: nameInput.value });
    localStorage.setItem('myCustomHabits', JSON.stringify(habits));
    nameInput.value = ''; renderHabits();
};

window.deleteHabit = function(id) {
    let habits = JSON.parse(localStorage.getItem('myCustomHabits')).filter(h => h.id !== id);
    localStorage.setItem('myCustomHabits', JSON.stringify(habits));
    renderHabits();
};

window.toggleHabit = function(id) {
    const today = new Date().toISOString().split('T')[0];
    let habitData = JSON.parse(localStorage.getItem('habitTracker')) || { date: today, states: {} };
    habitData.states[id] = !habitData.states[id];
    localStorage.setItem('habitTracker', JSON.stringify(habitData));
    renderHabits();
};

// === NOTIFICAÇÕES TOAST ===
function notify(msg) {
    if ("Notification" in window && Notification.permission === "granted") new Notification("Lembrete", { body: msg, icon: "https://cdn-icons-png.flaticon.com/512/2098/2098402.png" });
    const container = document.getElementById('toastContainer');
    if (container) {
        const toast = document.createElement('div');
        toast.className = 'toast-card';
        toast.innerHTML = `<div class="toast-header">Lembrete</div><div class="toast-body">${msg}</div>`;
        container.appendChild(toast);
        new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg').play().catch(()=>{});
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 500); }, 12000);
    }
}

setInterval(() => {
    const ts = JSON.parse(localStorage.getItem('tasks')) || [];
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const date = now.toISOString().split('T')[0];
    let mudou = false;

    ts.forEach(t => { 
        if(t.date === date && t.startTime === time && !t.completed && !t.notified) { 
            notify(`Está na hora de: ${t.text}`); 
            t.notified = true; 
            mudou = true;
        } 
    });
    
    if(mudou) localStorage.setItem('tasks', JSON.stringify(ts));
}, 10000);

// === POMODORO & DEEP FOCUS MODE ===
let defaultTime = 25 * 60; 
let timeLeft = defaultTime;
let timer = null;

const updateTimer = () => { 
    const m = Math.floor(timeLeft/60), s = timeLeft%60; 
    const timeString = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    
    // Atualiza o relógio gigante
    const display = document.getElementById('timerDisplay');
    if (display) display.innerText = timeString; 
    
    // NOVO: Atualiza o mini-timer flutuante simultaneamente
    const miniDisplay = document.getElementById('miniTimerText');
    if (miniDisplay) miniDisplay.innerText = timeString;
};

const timeInput = document.getElementById('customTimeInput');
if (timeInput) {
    timeInput.addEventListener('change', (e) => {
        let val = parseInt(e.target.value);
        if (isNaN(val) || val < 1) val = 25; 
        
        defaultTime = val * 60;
        if (!timer) { 
            timeLeft = defaultTime;
            updateTimer();
        }
    });
}

function enterDeepFocus() {
    ['mainHeader', 'mainNav', 'mainDivider', 'themeToggle'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.opacity = '0';
    });
    
    const timeConfigEl = document.querySelector('.time-config');
    if(timeConfigEl) timeConfigEl.style.opacity = '0'; 
    
    const mainContainer = document.getElementById('mainContainer');
    if (mainContainer) mainContainer.classList.add('deep-focus-active');
    
    const exitBtn = document.getElementById('exitFocusBtn');
    if (exitBtn) exitBtn.style.display = 'block';
}

window.exitDeepFocus = function() {
    ['mainHeader', 'mainNav', 'mainDivider', 'themeToggle'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.opacity = '1';
    });
    
    const timeConfigEl = document.querySelector('.time-config');
    if(timeConfigEl) timeConfigEl.style.opacity = '0.5'; 
    
    const mainContainer = document.getElementById('mainContainer');
    if (mainContainer) mainContainer.classList.remove('deep-focus-active');
    
    const exitBtn = document.getElementById('exitFocusBtn');
    if (exitBtn) exitBtn.style.display = 'none';
};

const exitBtn = document.getElementById('exitFocusBtn');
if(exitBtn) exitBtn.onclick = window.exitDeepFocus;

const startBtn = document.getElementById('startTimer');
if (startBtn) {
    startBtn.onclick = () => { 
        if(!timer) {
            enterDeepFocus();
            timer = setInterval(() => { 
                timeLeft--; 
                updateTimer(); 
                if(timeLeft<=0){ 
                    clearInterval(timer); 
                    timer = null; 
                    notify("Fim do ciclo de foco!"); 
                    exitDeepFocus();
                    timeLeft = defaultTime; 
                    updateTimer();
                    checkMiniTimer('pomodoroView'); // Atualiza sumiço do mini-timer se necessário
                } 
            }, 1000); 
            // Atualiza lógica do mini-timer no start
            checkMiniTimer('pomodoroView');
        }
    };
}

const pauseBtn = document.getElementById('pauseTimer');
if (pauseBtn) pauseBtn.onclick = () => { 
    clearInterval(timer); 
    timer = null; 
    checkMiniTimer('pomodoroView'); // Se pausou, o mini-timer some em outras abas
};

const resetBtn = document.getElementById('resetTimer');
if (resetBtn) {
    resetBtn.onclick = () => { 
        clearInterval(timer); 
        timer = null;
        timeLeft = defaultTime; 
        updateTimer(); 
        exitDeepFocus(); 
        checkMiniTimer('pomodoroView');
    };
}

// === SONS AMBIENTE ===
let currentSound = null;
window.toggleSound = function(soundType) {
    const sounds = ['rain', 'fire', 'waves'];
    sounds.forEach(s => { 
        const audio = document.getElementById('sound-' + s);
        if (audio) audio.pause(); 
        const btn = document.getElementById('btn-' + s);
        if (btn) btn.classList.remove('playing'); 
    });
    if (currentSound === soundType) {
        currentSound = null;
        return;
    }
    const activeAudio = document.getElementById('sound-' + soundType);
    if (activeAudio) activeAudio.play();
    const activeBtn = document.getElementById('btn-' + soundType);
    if (activeBtn) activeBtn.classList.add('playing');
    currentSound = soundType;
};

// === BACKUP ===
window.exportData = function() {
    const backup = { tasks: JSON.parse(localStorage.getItem('tasks')), habits: JSON.parse(localStorage.getItem('myCustomHabits')), tracker: JSON.parse(localStorage.getItem('habitTracker')) };
    const blob = new Blob([JSON.stringify(backup)], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = "planner_backup.json"; a.click();
};

window.importData = function(event) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const d = JSON.parse(e.target.result);
        if(d.tasks) localStorage.setItem('tasks', JSON.stringify(d.tasks));
        if(d.habits) localStorage.setItem('myCustomHabits', JSON.stringify(d.habits));
        if(d.tracker) localStorage.setItem('habitTracker', JSON.stringify(d.tracker));
        location.reload();
    };
    reader.readAsText(event.target.files[0]);
};