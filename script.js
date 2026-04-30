const input = document.getElementById('taskInput');
const dateInput = document.getElementById('taskDate');
const startTimeInput = document.getElementById('startTime');
const categoryInput = document.getElementById('taskCategory');
const list = document.getElementById('taskList');

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let myChart = null;

document.addEventListener('DOMContentLoaded', () => {
    getTasks();
    const dateOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    document.getElementById('currentDate').innerText = new Date().toLocaleDateString('pt-BR', dateOptions);
    
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }
    
    fetchDailyQuote();
});

async function fetchDailyQuote() {
    const quoteElement = document.getElementById('dailyQuote');
    try {
        const response = await fetch('https://dummyjson.com/quotes/random');
        const data = await response.json();
        quoteElement.innerText = `"${data.quote}" — ${data.author}`;
    } catch (error) {
        quoteElement.innerText = '"Breathe in, breathe out. You got this."';
    }
}

document.getElementById('themeToggle').onclick = () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    document.getElementById('themeIcon').className = isDark ? 'ph ph-sun' : 'ph ph-moon-stars';
    
    if (document.getElementById('statsView').style.display === 'flex') {
        renderStats();
    }
};

window.switchTab = function(tab) {
    const views = ['listView', 'calendarView', 'statsView', 'pomodoroView'];
    const btns = ['listTabBtn', 'calendarTabBtn', 'statsTabBtn', 'pomodoroTabBtn'];

    views.forEach(v => document.getElementById(v).style.display = 'none');
    btns.forEach(b => document.getElementById(b).classList.remove('active'));

    document.getElementById(tab + 'View').style.display = 'flex';
    document.getElementById(tab + 'TabBtn').classList.add('active');

    if (tab === 'calendar') renderCalendar();
    if (tab === 'stats') {
        setTimeout(renderStats, 50);
        renderHabits();
    }
};

window.addTask = function() {
    if (!input.value || !dateInput.value) return alert("Preencha a tarefa e a data!");
    if ("Notification" in window && Notification.permission !== "granted") Notification.requestPermission();
    
    const task = { text: input.value, date: dateInput.value, startTime: startTimeInput.value, category: categoryInput.value, completed: false, id: Date.now(), notified: false };
    let ts = JSON.parse(localStorage.getItem('tasks')) || [];
    ts.push(task);
    localStorage.setItem('tasks', JSON.stringify(ts));
    input.value = '';
    getTasks();
};
document.getElementById('addTaskBtn').onclick = window.addTask;

function getTasks() {
    list.innerHTML = '';
    let ts = JSON.parse(localStorage.getItem('tasks')) || [];
    const today = new Date().toISOString().split('T')[0];
    ts.filter(t => t.date === today).forEach(t => createTag(t));
    document.getElementById('countDisplay').innerText = `${ts.length} tarefas globais`;
}

function createTag(task) {
    const li = document.createElement('li');
    li.className = `cat-${task.category.toLowerCase()}`;
    li.innerHTML = `
        <div style="flex:1; cursor:pointer;" onclick="toggleTask(${task.id})">
            <span class="task-text ${task.completed ? 'completed' : ''}">${task.text}</span>
            <br><small style="opacity:0.6; font-size: 0.7rem;">🕒 ${task.startTime || '--:--'}</small>
        </div>
        <div style="display:flex; align-items:center;">
            <button onclick="event.stopPropagation(); editTask(${task.id})" style="background:none;border:none;cursor:pointer;margin-right:12px;font-size:1rem;"><i class="ph ph-pencil-simple"></i></button>
            <button onclick="event.stopPropagation(); deleteTask(${task.id})" style="background:none;border:none;cursor:pointer;color:#b05a5a;font-size:1rem;"><i class="ph ph-trash"></i></button>
        </div>
    `;
    list.appendChild(li);
}

window.toggleTask = id => {
    let ts = JSON.parse(localStorage.getItem('tasks'));
    ts.forEach(t => { if(t.id === id) t.completed = !t.completed });
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
    deleteTask(id);
    window.switchTab('list');
};

document.getElementById('clearBtn').onclick = () => {
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
    const now = new Date(), time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`, date = now.toISOString().split('T')[0];
    ts.forEach(t => { if(t.date === date && t.startTime === time && !t.completed && !t.notified) { notify(`Está na hora de: ${t.text}`); t.notified = true; localStorage.setItem('tasks', JSON.stringify(ts)); } });
}, 10000);

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
    listEl.innerHTML = dayTasks.length === 0 ? '<li style="border:none; opacity:0.5; justify-content:center;">Sem tarefas.</li>' : dayTasks.map(t => `<li class="${t.completed ? 'done' : ''}"><span>${t.completed ? '✓' : '•'} ${t.text}</span> <small>${t.startTime || ''}</small></li>`).join('');
    document.getElementById('dayTasksPopup').style.display = 'flex';
};
window.closeDayPopup = () => { const popup = document.getElementById('dayTasksPopup'); if(popup) popup.style.display = 'none'; };

window.renderStats = () => {
    const ts = JSON.parse(localStorage.getItem('tasks')) || [];
    const counts = { Personal: 0, Work: 0, Study: 0, Health: 0 };
    ts.forEach(t => { if(counts[t.category] !== undefined) counts[t.category]++; });
    const canvas = document.getElementById('categoryChart');
    if(!canvas) return;
    if(myChart) myChart.destroy();
    const isDark = document.body.classList.contains('dark-mode');
    myChart = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: { labels: Object.keys(counts), datasets: [{ data: Object.values(counts), backgroundColor: isDark ? ['#f2cdcd', '#89b4fa', '#cba6f7', '#a6e3a1'] : ['#ffcfd2', '#a2d2ff', '#cfdbd5', '#b9fbc0'], borderWidth: 2, borderColor: isDark ? '#1e1e2e' : '#f5ebe0' }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: isDark ? '#cdd6f4' : '#4a3f35', font: { family: 'Montserrat' } } } } }
    });
};

// === HABIT TRACKER DINÂMICO (CRIAR, LER, EDITAR, EXCLUIR) ===

/// === HABIT TRACKER DINÂMICO (COM AUTO-ÍCONE) ===

// Analisa a palavra digitada e retorna o ícone Phosphor apropriado
function getIconForHabit(name) {
    const text = name.toLowerCase();
    
    if (text.includes('água') || text.includes('agua') || text.includes('beber')) return '<i class="ph ph-drop"></i>';
    if (text.includes('ler') || text.includes('leitura') || text.includes('livro')) return '<i class="ph ph-book-open"></i>';
    if (text.includes('estudar') || text.includes('código') || text.includes('programar')) return '<i class="ph ph-laptop"></i>';
    if (text.includes('exercício') || text.includes('treino') || text.includes('academia') || text.includes('correr')) return '<i class="ph ph-barbell"></i>';
    if (text.includes('meditar') || text.includes('yoga') || text.includes('respirar')) return '<i class="ph ph-flower-lotus"></i>';
    if (text.includes('comer') || text.includes('dieta') || text.includes('fruta')) return '<i class="ph ph-apple-podcasts"></i>';
    
    // Ícone padrão caso o sistema não reconheça a palavra
    return '<i class="ph ph-sparkle"></i>'; 
}

function getHabitsList() {
    const defaultList = [
        { id: 'water', name: 'Beber 2L de Água', icon: '<i class="ph ph-drop"></i>' },
        { id: 'read', name: 'Ler 10 Páginas', icon: '<i class="ph ph-book-open"></i>' }
    ];
    return JSON.parse(localStorage.getItem('myCustomHabits')) || defaultList;
}

window.renderHabits = function() {
    const container = document.getElementById('habitList');
    if(!container) return;
    
    const today = new Date().toISOString().split('T')[0];
    let habitData = JSON.parse(localStorage.getItem('habitTracker')) || { date: today, states: {} };
    
    if (habitData.date !== today) { 
        habitData = { date: today, states: {} }; 
        localStorage.setItem('habitTracker', JSON.stringify(habitData)); 
    }
    
    container.innerHTML = '';
    const habits = getHabitsList();
    
    habits.forEach(habit => {
        const isDone = habitData.states[habit.id] || false;
        const div = document.createElement('div');
        div.className = `habit-item ${isDone ? 'done' : ''}`;
        
        // Os ícones já vêm em formato HTML da nossa biblioteca Phosphor
        div.innerHTML = `
            <div style="display:flex; align-items:center; flex:1; gap: 8px;" onclick="toggleHabit('${habit.id}')">
                <span style="font-size: 1.2rem; display:flex; align-items:center;">${habit.icon}</span>
                <span>${habit.name}</span>
            </div>
            
            <div class="habit-actions">
                <button onclick="event.stopPropagation(); deleteHabit('${habit.id}')" class="habit-btn delete"><i class="ph ph-trash"></i></button>
            </div>
            
            <div class="habit-check" onclick="toggleHabit('${habit.id}')"><i class="ph ph-check-bold"></i></div>
        `;
        container.appendChild(div);
    });
};

window.addHabit = function() {
    const nameInput = document.getElementById('habitNameInput');
    
    if (!nameInput.value) return alert("Dê um nome ao seu hábito!");
    
    const newHabit = {
        id: 'h_' + Date.now(),
        icon: getIconForHabit(nameInput.value), // Chama a nossa nova função!
        name: nameInput.value
    };
    
    const habits = getHabitsList();
    habits.push(newHabit);
    localStorage.setItem('myCustomHabits', JSON.stringify(habits));
    
    nameInput.value = '';
    renderHabits();
};

window.deleteHabit = function(id) {
    if(!confirm("Tem certeza que quer excluir este hábito?")) return;
    let habits = getHabitsList();
    habits = habits.filter(h => h.id !== id);
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

let timeLeft = 25 * 60, timer;
const updateTimer = () => { const m = Math.floor(timeLeft/60), s = timeLeft%60; document.getElementById('timerDisplay').innerText = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; };
document.getElementById('startTimer').onclick = () => { if(!timer) timer = setInterval(() => { timeLeft--; updateTimer(); if(timeLeft<=0){ clearInterval(timer); timer = null; notify("Fim do ciclo de foco!"); } }, 1000); };
document.getElementById('pauseTimer').onclick = () => { clearInterval(timer); timer = null; };
document.getElementById('resetTimer').onclick = () => { timeLeft = 25*60; updateTimer(); };

let currentSound = null;
window.toggleSound = function(soundType) {
    const sounds = ['rain', 'fire', 'waves'];
    sounds.forEach(s => { const audioEl = document.getElementById('sound-' + s), btnEl = document.getElementById('btn-' + s); if (audioEl) audioEl.pause(); if (btnEl) btnEl.classList.remove('playing'); });
    if (currentSound === soundType) return currentSound = null;
    const activeAudio = document.getElementById('sound-' + soundType), activeBtn = document.getElementById('btn-' + soundType);
    if (activeAudio && activeBtn) { activeAudio.volume = soundType === 'fire' ? 0.5 : 0.3; activeAudio.play().catch(e => console.log("Áudio bloqueado", e)); activeBtn.classList.add('playing'); currentSound = soundType; }
};