const defaultClasses = [
  {id: 1, name: "Year2", room: "A-101", teacher: "Ms. Lina", students: 28, capacity: 35},
  {id: 2, name: "Year3", room: "B-203", teacher: "Mr. Vannak", students: 31, capacity: 35},
  {id: 3, name: "Year2", room: "C-105", teacher: "Ms. Sophea", students: 26, capacity: 32},
  {id: 4, name: "Year4", room: "D-302", teacher: "Mr. Rithy", students: 30, capacity: 36},
];

const defaultTeachers = [
  {id:1,name:"Lina Chenda",department:"Mathematics",email:"lina@edunova.edu",phone:"012 402 551",classes:3},
  {id:2,name:"Vannak Chea",department:"English",email:"vannak@edunova.edu",phone:"010 882 019",classes:4},
  {id:3,name:"Sophea Lim",department:"Science",email:"sophea@edunova.edu",phone:"096 244 7001",classes:3},
  {id:4,name:"Rithy Sok",department:"Information Technology",email:"rithy@edunova.edu",phone:"015 632 410",classes:2},
];

const defaultStudents = [
  {id:1, code:"ST-1001", name:"Sok Dara", className:"Year1", gender:"Male", phone:"012 345 678", email:"dara@example.com", status:"Active"},
  {id:2, code:"ST-1002", name:"Chan Sreypov", className:"Year1", gender:"Female", phone:"096 222 4501", email:"sreypov@example.com", status:"Active"},
  {id:3, code:"ST-1003", name:"Lim Panha", className:"Year2", gender:"Male", phone:"010 769 231", email:"panha@example.com", status:"Active"},
  {id:4, code:"ST-1004", name:"Kim Sreyneang", className:"Year3", gender:"Female", phone:"088 522 1840", email:"sreyneang@example.com", status:"Inactive"},
  {id:5, code:"ST-1005", name:"Heng Visal", className:"Year4", gender:"Male", phone:"015 441 903", email:"visal@example.com", status:"Active"},
];

let students = JSON.parse(localStorage.getItem("edunova_students")) || defaultStudents;
let teachers = JSON.parse(localStorage.getItem("edunova_teachers")) || defaultTeachers;
let classes = JSON.parse(localStorage.getItem("edunova_classes")) || defaultClasses;
let attendance = JSON.parse(localStorage.getItem("edunova_attendance")) || {};

const titles = {
  dashboard:["Dashboard","Welcome back. Here is today’s school overview."],
  students:["Students","Manage student information and enrollment."],
  teachers:["Teachers","Manage teachers and departments."],
  classes:["Classes","Organize rooms, classes and capacity."],
  attendance:["Attendance","Track daily student attendance."],
  grades:["Grades","Review student academic performance."],
  settings:["Settings","Configure your school information."]
};

document.addEventListener("DOMContentLoaded", () => {
  initializeAuthUser();
  initializeNavigation();
  fillClassSelects();
  renderAll();
  bindEvents();
  document.getElementById("attendanceDate").value = new Date().toISOString().split("T")[0];
});

function initializeNavigation(){
  document.querySelectorAll("[data-page]").forEach(btn => btn.addEventListener("click", () => showPage(btn.dataset.page)));
  document.querySelectorAll("[data-page-jump]").forEach(btn => btn.addEventListener("click", () => showPage(btn.dataset.pageJump)));
  document.getElementById("menuBtn").addEventListener("click", () => document.getElementById("sidebar").classList.toggle("show"));
}

function showPage(page){
  document.querySelectorAll(".page-section").forEach(el => el.classList.remove("active"));
  document.getElementById(`${page}Page`).classList.add("active");
  document.querySelectorAll(".sidebar .nav-link").forEach(el => el.classList.toggle("active", el.dataset.page === page));
  document.getElementById("pageTitle").textContent = titles[page][0];
  document.getElementById("pageSubtitle").textContent = titles[page][1];
  document.getElementById("sidebar").classList.remove("show");
  if(page === "attendance") renderAttendance();
}

function bindEvents(){
  document.getElementById("studentForm").addEventListener("submit", saveStudent);
  document.getElementById("addStudentBtn").addEventListener("click", resetStudentForm);
  ["studentSearch","classFilter","statusFilter"].forEach(id => document.getElementById(id).addEventListener("input", renderStudents));
  document.getElementById("globalSearch").addEventListener("input", e => {
    showPage("students");
    document.getElementById("studentSearch").value = e.target.value;
    renderStudents();
  });
  document.getElementById("attendanceClassFilter").addEventListener("change", renderAttendance);
  document.getElementById("attendanceDate").addEventListener("change", renderAttendance);
  document.getElementById("saveAttendanceBtn").addEventListener("click", saveAttendance);
  document.getElementById("exportGradesBtn").addEventListener("click", exportGrades);
  document.getElementById("settingsForm").addEventListener("submit", e => {
    e.preventDefault();
    showToast("School settings saved successfully.");
  });
  document.getElementById("addTeacherBtn").addEventListener("click", () => showToast("Teacher form can be added next."));
  document.getElementById("addClassBtn").addEventListener("click", () => showToast("Class form can be added next."));
}

function renderAll(){
  renderDashboard();
  renderStudents();
  renderTeachers();
  renderClasses();
  renderAttendance();
  renderGrades();
}

function renderDashboard(){
  document.getElementById("studentCount").textContent = students.length;
  document.getElementById("teacherCount").textContent = teachers.length;
  document.getElementById("classCount").textContent = classes.length;

  const todayKey = new Date().toISOString().split("T")[0];
  const todayAttendance = attendance[todayKey] || {};
  const present = Object.values(todayAttendance).filter(v => v === "Present").length;
  const rate = students.length ? Math.round((present || students.filter(s=>s.status==="Active").length) / students.length * 100) : 0;
  document.getElementById("attendanceRate").textContent = `${Math.min(rate,100)}%`;

  const body = document.getElementById("recentStudentsBody");
  body.innerHTML = students.slice(-5).reverse().map(studentRowCompact).join("") || emptyTableRow(4,"No students yet");
}

function studentRowCompact(s){
  return `<tr>
    <td><div class="student-cell"><div class="student-avatar">${initials(s.name)}</div><div><strong>${escapeHtml(s.name)}</strong><small>${escapeHtml(s.code)}</small></div></div></td>
    <td>${escapeHtml(s.className)}</td>
    <td>${escapeHtml(s.gender)}</td>
    <td><span class="status-badge ${s.status.toLowerCase()}">${s.status}</span></td>
  </tr>`;
}

function renderStudents(){
  const query = document.getElementById("studentSearch").value.toLowerCase().trim();
  const className = document.getElementById("classFilter").value;
  const status = document.getElementById("statusFilter").value;

  const filtered = students.filter(s => {
    const haystack = `${s.name} ${s.code} ${s.className}`.toLowerCase();
    return haystack.includes(query) && (!className || s.className === className) && (!status || s.status === status);
  });

  const body = document.getElementById("studentsTableBody");
  body.innerHTML = filtered.map(s => `<tr>
    <td><strong>${escapeHtml(s.code)}</strong></td>
    <td><div class="student-cell"><div class="student-avatar">${initials(s.name)}</div><div><strong>${escapeHtml(s.name)}</strong><small>${escapeHtml(s.email || "No email")}</small></div></div></td>
    <td>${escapeHtml(s.className)}</td>
    <td>${escapeHtml(s.gender)}</td>
    <td>${escapeHtml(s.phone || "-")}</td>
    <td><span class="status-badge ${s.status.toLowerCase()}">${s.status}</span></td>
    <td class="text-end">
      <button class="action-icon edit me-1" onclick="editStudent(${s.id})"><i class="bi bi-pencil"></i></button>
      <button class="action-icon delete" onclick="deleteStudent(${s.id})"><i class="bi bi-trash3"></i></button>
    </td>
  </tr>`).join("");

  document.getElementById("studentEmpty").classList.toggle("d-none", filtered.length > 0);
}

function fillClassSelects(){
  const options = classes.map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join("");
  document.getElementById("studentClass").innerHTML = `<option value="">Select class</option>${options}`;
  document.getElementById("classFilter").innerHTML = `<option value="">All classes</option>${options}`;
  document.getElementById("attendanceClassFilter").innerHTML = `<option value="">All classes</option>${options}`;
}

function resetStudentForm(){
  document.getElementById("studentForm").reset();
  document.getElementById("editStudentId").value = "";
  document.getElementById("studentModalTitle").textContent = "Add New Student";
}

function saveStudent(e){
  e.preventDefault();
  const editId = Number(document.getElementById("editStudentId").value);
  const record = {
    id: editId || Date.now(),
    name: document.getElementById("studentName").value.trim(),
    code: document.getElementById("studentCode").value.trim(),
    className: document.getElementById("studentClass").value,
    gender: document.getElementById("studentGender").value,
    phone: document.getElementById("studentPhone").value.trim(),
    email: document.getElementById("studentEmail").value.trim(),
    status: document.getElementById("studentStatus").value
  };

  const duplicate = students.some(s => s.code.toLowerCase() === record.code.toLowerCase() && s.id !== editId);
  if(duplicate){ showToast("Student ID already exists."); return; }

  if(editId){
    students = students.map(s => s.id === editId ? record : s);
    showToast("Student updated successfully.");
  }else{
    students.push(record);
    showToast("Student added successfully.");
  }
  persist();
  bootstrap.Modal.getOrCreateInstance(document.getElementById("studentModal")).hide();
  renderAll();
}

window.editStudent = function(id){
  const s = students.find(x => x.id === id);
  if(!s) return;
  document.getElementById("editStudentId").value = s.id;
  document.getElementById("studentName").value = s.name;
  document.getElementById("studentCode").value = s.code;
  document.getElementById("studentClass").value = s.className;
  document.getElementById("studentGender").value = s.gender;
  document.getElementById("studentPhone").value = s.phone;
  document.getElementById("studentEmail").value = s.email;
  document.getElementById("studentStatus").value = s.status;
  document.getElementById("studentModalTitle").textContent = "Edit Student";
  bootstrap.Modal.getOrCreateInstance(document.getElementById("studentModal")).show();
}

window.deleteStudent = function(id){
  const s = students.find(x => x.id === id);
  if(!s || !confirm(`Delete ${s.name}?`)) return;
  students = students.filter(x => x.id !== id);
  persist();
  renderAll();
  showToast("Student removed.");
}

function renderTeachers(){
  document.getElementById("teacherGrid").innerHTML = teachers.map(t => `<div class="col-md-6 col-xl-4">
    <div class="teacher-card h-100">
      <div class="teacher-head"><div class="teacher-photo">${initials(t.name)}</div><div><h4>${escapeHtml(t.name)}</h4><p>${escapeHtml(t.department)}</p></div></div>
      <div class="teacher-meta"><span><i class="bi bi-envelope me-1"></i>${escapeHtml(t.email)}</span><strong>${t.classes} classes</strong></div>
    </div>
  </div>`).join("");
}

function renderClasses(){
  document.getElementById("classGrid").innerHTML = classes.map(c => {
    const pct = Math.min(100, Math.round(c.students/c.capacity*100));
    return `<div class="col-md-6 col-xl-4"><div class="class-card h-100">
      <div class="class-top"><div><h4>${escapeHtml(c.name)}</h4><p>${escapeHtml(c.room)} • ${escapeHtml(c.teacher)}</p></div><div class="class-icon"><i class="bi bi-journal-bookmark-fill"></i></div></div>
      <div class="d-flex justify-content-between mt-4 mb-2"><small>Enrollment</small><strong>${c.students}/${c.capacity}</strong></div>
      <div class="progress"><div class="progress-bar" style="width:${pct}%"></div></div>
    </div></div>`;
  }).join("");
}

function renderAttendance(){
  const filter = document.getElementById("attendanceClassFilter").value;
  const date = document.getElementById("attendanceDate").value || new Date().toISOString().split("T")[0];
  const day = attendance[date] || {};
  const list = students.filter(s => !filter || s.className === filter);
  document.getElementById("attendanceBody").innerHTML = list.map(s => {
    const current = day[s.id] || "Present";
    return `<tr>
      <td><div class="student-cell"><div class="student-avatar">${initials(s.name)}</div><strong>${escapeHtml(s.name)}</strong></div></td>
      <td>${escapeHtml(s.className)}</td>
      ${["Present","Absent","Late"].map(state => `<td class="text-center"><input class="attendance-radio" type="radio" name="att_${s.id}" value="${state}" ${current===state?"checked":""}></td>`).join("")}
    </tr>`;
  }).join("") || emptyTableRow(5,"No students in this class");
}

function saveAttendance(){
  const date = document.getElementById("attendanceDate").value;
  if(!date){ showToast("Please choose a date."); return; }
  attendance[date] = attendance[date] || {};
  document.querySelectorAll('#attendanceBody input[type="radio"]:checked').forEach(input => {
    const id = input.name.replace("att_","");
    attendance[date][id] = input.value;
  });
  localStorage.setItem("edunova_attendance", JSON.stringify(attendance));
  renderDashboard();
  showToast("Attendance saved successfully.");
}

function renderGrades(){
  const rows = students.map((s,index) => {
    const math = 68 + (index*7)%29;
    const english = 72 + (index*5)%25;
    const science = 65 + (index*9)%32;
    const avg = Math.round((math+english+science)/3);
    return {s,math,english,science,avg,grade: letterGrade(avg)};
  });
  document.getElementById("gradesBody").innerHTML = rows.map(r => `<tr>
    <td><div class="student-cell"><div class="student-avatar">${initials(r.s.name)}</div><strong>${escapeHtml(r.s.name)}</strong></div></td>
    <td>${r.math}</td><td>${r.english}</td><td>${r.science}</td><td><strong>${r.avg}%</strong></td><td><span class="grade-pill">${r.grade}</span></td>
  </tr>`).join("");
}

function exportGrades(){
  const lines = [["Student ID","Student","Class","Mathematics","English","Science","Average","Grade"]];
  students.forEach((s,index) => {
    const math=68+(index*7)%29, english=72+(index*5)%25, science=65+(index*9)%32;
    const avg=Math.round((math+english+science)/3);
    lines.push([s.code,s.name,s.className,math,english,science,avg,letterGrade(avg)]);
  });
  const csv = lines.map(row => row.map(v => `"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
  const blob = new Blob([csv],{type:"text/csv"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="student-grades.csv"; a.click();
  URL.revokeObjectURL(a.href);
  showToast("Grades exported.");
}

function letterGrade(avg){ return avg>=90?"A":avg>=80?"B":avg>=70?"C":avg>=60?"D":"F"; }
function persist(){ localStorage.setItem("edunova_students",JSON.stringify(students)); }
function initials(name){ return name.split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase(); }
function emptyTableRow(cols,msg){ return `<tr><td colspan="${cols}" class="text-center py-5 text-muted">${msg}</td></tr>`; }
function escapeHtml(value=""){ return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c])); }
function showToast(message){
  document.getElementById("toastMessage").textContent = message;
  bootstrap.Toast.getOrCreateInstance(document.getElementById("appToast"),{delay:2400}).show();
}

function initializeAuthUser(){
  const session = JSON.parse(
    localStorage.getItem("edunova_session") ||
    sessionStorage.getItem("edunova_session") ||
    "null"
  );

  if(!session){
    window.location.replace("school_management_final/assets/html/login.html");
    return;
  }

  const profileName = document.querySelector(".profile-chip strong");
  const profileRole = document.querySelector(".profile-chip small");
  const profileAvatar = document.querySelector(".profile-chip .avatar");

  if(profileName) profileName.textContent = session.name;
  if(profileRole) profileRole.textContent = session.role;
  if(profileAvatar) profileAvatar.textContent = initials(session.name);

  const logoutBtn = document.getElementById("logoutBtn");
  if(logoutBtn){
    logoutBtn.addEventListener("click", () => {
      if(!confirm("Do you want to logout?")) return;
      localStorage.removeItem("edunova_session");
      sessionStorage.removeItem("edunova_session");
    window.location.replace("school_management_final/assets/html/login.html");
    });
  }
}