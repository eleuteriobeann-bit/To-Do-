// To-Do Application - JavaScript
// Features: Add, delete, complete tasks, filters, persistence, and accessibility

class ToDoApp {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.cacheElements();
        this.attachEventListeners();
        this.render();
    }

    cacheElements() {
        this.taskForm = document.getElementById('taskForm');
        this.taskInput = document.getElementById('taskInput');
        this.taskList = document.getElementById('taskList');
        this.emptyState = document.getElementById('emptyState');
        this.charCounter = document.getElementById('charCounter');
        this.clearCompletedBtn = document.getElementById('clearCompleted');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.activeCount = document.getElementById('activeCount');
        this.completedCount = document.getElementById('completedCount');
        this.totalCount = document.getElementById('totalCount');
    }

    attachEventListeners() {
        // Form submission
        this.taskForm.addEventListener('submit', (e) => this.handleAddTask(e));

        // Character counter
        this.taskInput.addEventListener('input', (e) => this.updateCharCounter(e));

        // Filter buttons
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilterChange(e));
        });

        // Clear completed
        this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    handleAddTask(e) {
        e.preventDefault();
        const text = this.taskInput.value.trim();

        if (!text) {
            this.taskInput.focus();
            return;
        }

        const task = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.push(task);
        this.saveTasks();
        this.taskInput.value = '';
        this.charCounter.textContent = '0';
        this.render();
        this.taskInput.focus();

        // Announce to screen readers
        this.announceToScreenReader(`Task "${text}" added to your to-do list`);
    }

    handleDeleteTask(id) {
        const task = this.tasks.find(t => t.id === id);
        const taskText = task ? task.text : 'Task';
        
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasks();
        this.render();

        // Announce to screen readers
        this.announceToScreenReader(`${taskText} deleted from your to-do list`);
    }

    handleToggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.render();

            const status = task.completed ? 'completed' : 'marked as incomplete';
            this.announceToScreenReader(`Task "${task.text}" ${status}`);
        }
    }

    handleFilterChange(e) {
        // Update aria-pressed attributes
        this.filterButtons.forEach(btn => {
            btn.setAttribute('aria-pressed', 'false');
        });
        e.target.setAttribute('aria-pressed', 'true');

        // Update active state
        this.filterButtons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        this.currentFilter = e.target.dataset.filter;
        this.render();
    }

    clearCompleted() {
        const completedCount = this.tasks.filter(t => t.completed).length;
        if (completedCount === 0) return;

        this.tasks = this.tasks.filter(t => !t.completed);
        this.saveTasks();
        this.render();

        this.announceToScreenReader(`${completedCount} completed task(s) cleared`);
    }

    handleKeyboardShortcuts(e) {
        // Delete key on focused task
        if (e.key === 'Delete') {
            const focused = document.activeElement;
            if (focused.classList.contains('task-delete-btn')) {
                const taskId = parseInt(focused.dataset.id);
                this.handleDeleteTask(taskId);
            }
        }
    }

    updateCharCounter(e) {
        const count = e.target.value.length;
        this.charCounter.textContent = count;
    }

    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'active':
                return this.tasks.filter(t => !t.completed);
            case 'completed':
                return this.tasks.filter(t => t.completed);
            case 'all':
            default:
                return this.tasks;
        }
    }

    updateStats() {
        const active = this.tasks.filter(t => !t.completed).length;
        const completed = this.tasks.filter(t => t.completed).length;
        const total = this.tasks.length;

        this.activeCount.textContent = active;
        this.completedCount.textContent = completed;
        this.totalCount.textContent = total;

        // Disable clear button if no completed tasks
        this.clearCompletedBtn.disabled = completed === 0;
    }

    render() {
        const filteredTasks = this.getFilteredTasks();

        // Clear task list
        this.taskList.innerHTML = '';

        // Show/hide empty state
        if (this.tasks.length === 0) {
            this.emptyState.classList.remove('hidden');
        } else {
            this.emptyState.classList.add('hidden');
        }

        // Render tasks
        filteredTasks.forEach((task, index) => {
            const li = this.createTaskElement(task, index + 1, filteredTasks.length);
            this.taskList.appendChild(li);
        });

        // Update stats
        this.updateStats();
    }

    createTaskElement(task, position, total) {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.setAttribute('role', 'listitem');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task-checkbox';
        checkbox.checked = task.completed;
        checkbox.aria-label = `Mark "${task.text}" as ${task.completed ? 'incomplete' : 'complete'}`;
        checkbox.addEventListener('change', () => this.handleToggleTask(task.id));

        const span = document.createElement('span');
        span.className = 'task-text';
        span.textContent = task.text;

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'task-delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.dataset.id = task.id;
        deleteBtn.setAttribute('aria-label', `Delete task: ${task.text}`);
        deleteBtn.addEventListener('click', () => this.handleDeleteTask(task.id));

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(deleteBtn);

        return li;
    }

    saveTasks() {
        localStorage.setItem('todoTasks', JSON.stringify(this.tasks));
    }

    loadTasks() {
        const saved = localStorage.getItem('todoTasks');
        return saved ? JSON.parse(saved) : [];
    }

    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.className = 'sr-only';
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.textContent = message;

        document.body.appendChild(announcement);

        setTimeout(() => announcement.remove(), 1000);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ToDoApp();
});
