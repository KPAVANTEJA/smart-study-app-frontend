/* Smart Study Planner — Ultimate JS */
/* Features:
   - Task CRUD with subject, priority, date/time, completed
   - Search & Filters
   - Mini calendar (shows days with tasks)
   - Timeline for upcoming deadlines
   - Export / Import JSON
   - Pomodoro timer (work/break), notifications
   - Browser notifications (permission)
   - Achievements (badges), XP & Levels
   - Charts: tasks by subject + status
   - Voice input (Web Speech API)
*/

// Data & DOM references
let tasks = JSON.parse(localStorage.getItem('ssp_tasks') || '[]');
let meta = JSON.parse(localStorage.getItem('ssp_meta') || '{}');
meta.xp = meta.xp || 0;
meta.streak = meta.streak || 0;
meta.lastCompleted = meta.lastCompleted || null;
meta.badges = meta.badges || [];

const el = id => document.getElementById(id);
const tasksEl = el('tasks');
const progressFill = el('progressFill');
const progressText = el('progressText');
const timelineList = el('timelineList');
const miniCalendar = el('miniCalendar');
const streakText = el('streakText');
const xpText = el('xpText');
const badgesWrap = el('badgesWrap');

// init UI elements
const addTaskBtn = el('addTaskBtn');
const resetBtn = el('resetBtn');
const exportBtn = el('exportBtn');
const importFile = el('importFile');
const searchInput = el('searchInput');
const filterSubject = el('filterSubject');
const filterPriority = el('filterPriority');
const filterStatus = el('filterStatus');
const darkModeToggle = el('darkModeToggle');
const notifyPermissionBtn = el('notifyPermissionBtn');
const voiceBtn = el('voiceBtn');

// Helper funcs
function saveAll(){
  localStorage.setItem('ssp_tasks', JSON.stringify(tasks));
  localStorage.setItem('ssp_meta', JSON.stringify(meta));
}

function uid(){return Date.now() + Math.floor(Math.random()*999)}

function formatDate(d){
  if(!d) return '';
  // d like YYYY-MM-DD
  return d;
}

function notify(title, body){
  if(!("Notification" in window)) return;
  if(Notification.permission === "granted"){
    new Notification(title, {body, icon: ''});
  }
}

function updateBadges(){
  const badges = meta.badges || [];
  badgesWrap.innerHTML = '';
  const possible = [
    {id:'starter', name:'Welcome!', desc:'Added first task'},
    {id:'task10', name:'Task Master', desc:'Complete 10 tasks'},
    {id:'streak7', name:'7-day Streak', desc:'7 days active'},
    {id:'priorityPro', name:'Priority Pro', desc:'Complete 5 high-priority tasks'}
  ];
  possible.forEach(b=>{
    const has = badges.includes(b.id);
    const div = document.createElement('div');
    div.className = 'badge';
    div.innerHTML = `<strong>${b.name}</strong><div class="small">${b.desc}</div>`;
    if(has) div.style.border = '1px solid #2ecc71';
    badgesWrap.appendChild(div);
  });
}

function awardBadge(bid){
  if(!meta.badges.includes(bid)){
    meta.badges.push(bid);
    saveAll();
    updateBadges();
    notify('Badge unlocked!', `You unlocked: ${bid}`);
  }
}

// Render
function renderTasks(){
  // apply filters
  const q = searchInput.value.trim().toLowerCase();
  const subj = filterSubject.value;
  const prio = filterPriority.value;
  const status = filterStatus.value;

  const list = tasks
    .filter(t=>{
      if(q && !(t.name.toLowerCase().includes(q) || (t.subject && t.subject.toLowerCase().includes(q)))) return false;
      if(subj !== 'All' && t.subject !== subj) return false;
      if(prio !== 'All' && t.priority !== prio) return false;
      if(status !== 'All'){
        if(status === 'Pending' && t.completed) return false;
        if(status === 'Completed' && !t.completed) return false;
      }
      return true;
    })
    .sort((a,b)=> (a.date||'9999') - (b.date||'9999') || a.priority.localeCompare(b.priority));

  tasksEl.innerHTML = '';
  list.forEach(t=>{
    const li = document.createElement('li');
    li.className = 'task-item' + (t.completed ? ' completed' : '');
    const left = document.createElement('div'); left.className='task-meta';
    const title = document.createElement('div'); title.className='task-title'; title.textContent = t.name;
    const sub = document.createElement('div'); sub.className='task-sub';
    sub.textContent = `${t.subject} • ${t.priority} • Due: ${t.date || '—'} ${t.time||''}`;
    left.appendChild(title); left.appendChild(sub);

    const actions = document.createElement('div'); actions.className='task-actions';
    const doneBtn = document.createElement('button'); doneBtn.className='done'; doneBtn.textContent = t.completed ? '↺' : '✔';
    doneBtn.onclick = ()=>toggleComplete(t.id);
    const delBtn = document.createElement('button'); delBtn.className='del'; delBtn.textContent = '🗑';
    delBtn.onclick = ()=>deleteTask(t.id);
    actions.appendChild(doneBtn); actions.appendChild(delBtn);

    li.appendChild(left); li.appendChild(actions);
    tasksEl.appendChild(li);
  });

  updateProgress();
  renderCharts();
  renderTimeline();
  renderCalendar();
  renderXP();
  updateBadges();
}

function updateProgress(){
  const total = tasks.length;
  const completed = tasks.filter(t=>t.completed).length;
  const percent = total ? Math.round((completed/total)*100) : 0;
  progressFill.style.width = percent + '%';
  progressText.textContent = `${percent}% completed`;
}

// CRUD
function addTask(){
  const name = el('taskInput').value.trim();
  const date = el('taskDate').value;
  const time = el('taskTime').value;
  const subject = el('subjectSelect').value;
  const priority = el('prioritySelect').value;
  if(!name || !date){ alert('Please enter at least title and date'); return; }

  const t = { id: uid(), name, date, time, subject, priority, completed:false, created: new Date().toISOString() };
  tasks.push(t);
  saveAll();
  renderTasks();
  el('taskInput').value=''; el('taskDate').value=''; el('taskTime').value='';
  // auto-award starter badge
  if(tasks.length >= 1) awardBadge('starter');

  // schedule notification if within 24 hours
  scheduleDeadlineNotification(t);
}

function toggleComplete(id){
  tasks = tasks.map(t=> t.id===id ? {...t, completed: !t.completed} : t );
  // handle XP and streaks when marking completed
  const t = tasks.find(x=>x.id===id);
  if(t.completed){
    meta.xp = (meta.xp || 0) + 10;
    // priority badge: count high priority completed
    const highCompleted = tasks.filter(x=>x.priority==='High' && x.completed).length;
    if(highCompleted >=5) awardBadge('priorityPro');
    // total completed badge
    const totalCompleted = tasks.filter(x=>x.completed).length;
    if(totalCompleted >= 10) awardBadge('task10');
    // streak logic
    const today = new Date().toISOString().split('T')[0];
    if(meta.lastCompleted !== today){
      // if lastCompleted is yesterday, increment, else reset
      const yesterday = new Date(Date.now()-86400000).toISOString().split('T')[0];
      if(meta.lastCompleted === yesterday) meta.streak = (meta.streak || 0) + 1;
      else meta.streak = 1;
      meta.lastCompleted = today;
      if(meta.streak >= 7) awardBadge('streak7');
    }
  }
  saveAll();
  renderTasks();
}

function deleteTask(id){
  if(!confirm('Delete this task?')) return;
  tasks = tasks.filter(t=>t.id!==id);
  saveAll(); renderTasks();
}

// Timeline & Calendar
function renderTimeline(){
  timelineList.innerHTML = '';
  const upcoming = tasks.filter(t=>!t.completed).sort((a,b)=> (a.date||'9999') - (b.date||'9999')).slice(0,6);
  upcoming.forEach(t=>{
    const div = document.createElement('div'); div.className='titem';
    div.innerHTML = `<strong>${t.name}</strong><div class="small">${t.subject} • ${t.priority} • ${t.date} ${t.time||''}</div>`;
    timelineList.appendChild(div);
  });
}

function renderCalendar(){
  // show current month mini calendar with marks for days that have tasks
  const now = new Date();
  const year = now.getFullYear(), month = now.getMonth();
  const first = new Date(year, month, 1);
  const startDay = first.getDay(); // 0..6
  const daysInMonth = new Date(year, month+1, 0).getDate();

  miniCalendar.innerHTML = '';
  // show weekday headers
  const headers = ['S','M','T','W','T','F','S'];
  headers.forEach(h=>{
    const hd = document.createElement('div'); hd.className='mini-day'; hd.style.fontSize='0.8rem'; hd.textContent=h;
    miniCalendar.appendChild(hd);
  });
  // blank slots
  for(let i=0;i<startDay;i++){
    const blank = document.createElement('div'); blank.className='mini-day'; blank.style.opacity='0.3'; blank.textContent='';
    miniCalendar.appendChild(blank);
  }
  // days
  for(let d=1; d<=daysInMonth; d++){
    const dayDiv = document.createElement('div'); dayDiv.className='mini-day';
    const dayStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const has = tasks.some(t=>t.date === dayStr && !t.completed);
    if(has) dayDiv.classList.add('has');
    dayDiv.textContent = d;
    miniCalendar.appendChild(dayDiv);
  }
}

// Charts
let chartSubjects = null, chartStatus = null;
function renderCharts(){
  // tasks by subject
  const counts = {};
  tasks.forEach(t=> counts[t.subject] = (counts[t.subject]||0)+1);
  const labels = Object.keys(counts);
  const data = Object.values(counts);

  if(chartSubjects) chartSubjects.destroy();
  const ctx1 = el('chartSubjects').getContext('2d');
  chartSubjects = new Chart(ctx1, {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: ['#4a90e2','#27ae60','#f39c12','#9b59b6','#e67e22','#7f8c8d'] }]},
    options: { plugins:{legend:{position:'bottom'} } }
  });

  // status
  const completed = tasks.filter(t=>t.completed).length;
  const pending = tasks.length - completed;
  if(chartStatus) chartStatus.destroy();
  const ctx2 = el('chartStatus').getContext('2d');
  chartStatus = new Chart(ctx2, {
    type:'pie',
    data:{ labels:['Completed','Pending'], datasets:[{ data:[completed,pending], backgroundColor:['#2ecc71','#f39c12']}]},
    options:{ plugins:{legend:{position:'bottom'}}}
  });
}

// Export / Import
exportBtn.addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify({tasks,meta},null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='ssp_backup.json'; a.click();
  URL.revokeObjectURL(url);
});

importFile.addEventListener('change', (e)=>{
  const f = e.target.files[0];
  if(!f) return;
  const reader = new FileReader();
  reader.onload = ev=>{
    try{
      const data = JSON.parse(ev.target.result);
      if(Array.isArray(data.tasks)){
        tasks = data.tasks;
        meta = data.meta || meta;
        saveAll(); renderTasks();
        alert('Imported successfully');
      } else alert('Invalid file format');
    }catch(err){ alert('Import failed: '+err.message) }
  };
  reader.readAsText(f);
});

// Search & Filters
searchInput.addEventListener('input', renderTasks);
filterSubject.addEventListener('change', renderTasks);
filterPriority.addEventListener('change', ()=>{ filterPriority.value = filterPriority.value; renderTasks();});
filterStatus.addEventListener('change', renderTasks);

// Dark Mode
darkModeToggle.addEventListener('click', ()=>{
  document.body.classList.toggle('dark');
  localStorage.setItem('ssp_dark', document.body.classList.contains('dark'));
});
if(localStorage.getItem('ssp_dark') === 'true') document.body.classList.add('dark');

// Notification Permission & scheduling
notifyPermissionBtn.addEventListener('click', requestNotifPermission);
function requestNotifPermission(){
  if(!("Notification" in window)){ alert('Notifications are not supported in this browser'); return; }
  Notification.requestPermission().then(p=>{
    alert('Notification permission: '+p);
  });
}

// schedule a notification for a task (if due in <=48 hours)
function scheduleDeadlineNotification(task){
  if(Notification.permission !== 'granted') return;
  try{
    const now = Date.now();
    const dt = new Date(task.date + 'T' + (task.time || '00:00')).getTime();
    const diff = dt - now;
    if(diff > 0 && diff <= 48*3600*1000){
      // schedule with setTimeout for the current session
      setTimeout(()=> {
        if(!task.completed) notify('Deadline approaching', `${task.name} due ${task.date} ${task.time||''}`);
      }, diff);
    } else if(diff <= 0 && diff > -3600*1000){
      // overdue recently
      notify('Task due now / overdue', `${task.name} is due ${task.date}`);
    }
  }catch(e){}
}

// schedule notifications for all tasks currently (on load)
function scheduleAll(){
  tasks.forEach(t=> scheduleDeadlineNotification(t));
}

// XP & Streak display
function renderXP(){
  streakText.textContent = `Streak: ${meta.streak || 0} days 🔥`;
  const level = Math.floor((meta.xp || 0) / 100) + 1;
  xpText.textContent = `XP: ${meta.xp || 0} — Level ${level}`;
}

// Pomodoro timer
let timerInterval = null;
let timerState = { mode:'work', left:25*60, work:25*60, break:5*60, running:false };
function updateTimerUI(){
  el('timerClock').textContent = `${String(Math.floor(timerState.left/60)).padStart(2,'0')}:${String(timerState.left%60).padStart(2,'0')}`;
  el('timerLabel').textContent = timerState.mode === 'work' ? 'Work' : 'Break';
}

function startTimer(){
  // read values
  timerState.work = parseInt(el('workMin').value || 25) * 60;
  timerState.break = parseInt(el('breakMin').value || 5) * 60;
  if(!timerState.running){
    timerState.mode = 'work';
    timerState.left = timerState.work;
    timerState.running = true;
    timerInterval = setInterval(()=> {
      timerState.left--;
      if(timerState.left <= 0){
        // switch
        if(timerState.mode === 'work'){ timerState.mode = 'break'; timerState.left = timerState.break; notify('Pomodoro', 'Work session finished — time for a break!'); meta.xp+=5; saveAll(); renderXP(); }
        else { timerState.mode = 'work'; timerState.left = timerState.work; notify('Pomodoro', 'Break finished — time to focus!'); }
      }
      updateTimerUI();
    }, 1000);
  }
}

function stopTimer(){ clearInterval(timerInterval); timerInterval=null; timerState.running=false; updateTimerUI(); }
function resetTimer(){ stopTimer(); timerState.left = timerState.work; updateTimerUI(); }

el('startTimerBtn').addEventListener('click', startTimer);
el('stopTimerBtn').addEventListener('click', stopTimer);
el('resetTimerBtn').addEventListener('click', resetTimer);
updateTimerUI();

// Voice input (Web Speech API)
voiceBtn.addEventListener('click', ()=>{
  if(!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)){ alert('Voice input not supported'); return; }
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  const rec = new SpeechRec();
  rec.lang = 'en-US';
  rec.interimResults = false;
  rec.onresult = (evt)=>{
    const text = evt.results[0][0].transcript;
    // try simple parse: "Add math task tomorrow: do exercises at 6pm priority high"
    el('taskInput').value = text;
    alert('Heard: ' + text + '\nEdit fields if needed and click Add');
  };
  rec.onerror = (e)=> console.log('voice err', e);
  rec.start();
});

// Buttons
addTaskBtn.addEventListener('click', addTask);
resetBtn.addEventListener('click', ()=>{ el('taskInput').value=''; el('taskDate').value=''; el('taskTime').value=''; });
el('voiceBtn').addEventListener('click', ()=>{/* handled above */});

// schedule notifications on page load
scheduleAll();

// Initialization
renderTasks();
renderXP();

// small convenience: if Notification permission granted, show a friendly welcome
if(Notification.permission === 'granted') notify('Smart Study Planner', 'Welcome back! Keep up the good work.');

// expose some funcs for debug in console
window.ssp = { tasks, meta, addTask, renderTasks, awardBadge };
