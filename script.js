// TodoアプリのJavaScript

class TodoApp {
    constructor() {
        console.log('TodoApp initialized');
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.init();
    }

    init() {
        console.log('Initializing TodoApp');
        this.bindEvents();
        this.renderTasks();
    }

    bindEvents() {
        console.log('Binding events');
        
        // 追加ボタンのイベント
        const addBtn = document.querySelector('.add-btn');
        console.log('Add button found:', addBtn);
        
        if (addBtn) {
            addBtn.addEventListener('click', (e) => {
                console.log('Add button clicked');
                this.addTask();
            });
        } else {
            console.error('Add button not found!');
        }

        // Enterキーでの追加
        const taskInput = document.querySelector('#task-input');
        console.log('Task input found:', taskInput);
        
        if (taskInput) {
            taskInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    console.log('Enter key pressed');
                    this.addTask();
                }
            });

            // 入力フィールドのフォーカスイベント
            taskInput.addEventListener('focus', () => this.hideError());
        } else {
            console.error('Task input not found!');
        }
    }

    addTask() {
        console.log('addTask method called');
        
        const taskInput = document.querySelector('#task-input');
        const dateInput = document.querySelector('#date');
        const errorMsg = document.querySelector('.error-msg');

        const taskText = taskInput.value.trim();
        const taskDate = dateInput.value;

        console.log('Task text:', taskText);
        console.log('Task date:', taskDate);

        // バリデーション
        if (!taskText) {
            this.showError('タスクを入力してください');
            return;
        }

        // 新しいタスクオブジェクトを作成
        const newTask = {
            id: Date.now(),
            text: taskText,
            date: taskDate,
            completed: false,
            createdAt: new Date().toISOString()
        };

        console.log('New task created:', newTask);

        // タスクを配列に追加
        this.tasks.push(newTask);

        // ローカルストレージに保存
        this.saveTasks();

        // タスクリストを再描画
        this.renderTasks();

        // 入力フィールドをクリア
        taskInput.value = '';
        dateInput.value = '';

        // 成功メッセージを表示
        this.showSuccess('タスクが追加されました！');
    }

    deleteTask(taskId) {
        console.log('Deleting task:', taskId);
        
        if (confirm('このタスクを削除しますか？')) {
            this.tasks = this.tasks.filter(task => task.id !== taskId);
            this.saveTasks();
            this.renderTasks();
            this.showSuccess('タスクが削除されました');
        }
    }

    toggleComplete(taskId) {
        console.log('Toggling complete for task:', taskId);
        
        const task = this.tasks.find(task => task.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.renderTasks();
        }
    }

    renderTasks() {
        console.log('Rendering tasks, count:', this.tasks.length);
        
        const taskList = document.querySelector('.task-list');
        taskList.innerHTML = '';

        if (this.tasks.length === 0) {
            taskList.innerHTML = '<li style="text-align: center; color: #666; padding: 20px;">タスクがありません</li>';
            return;
        }

        // 日付でソート（新しい順）
        const sortedTasks = [...this.tasks].sort((a, b) => {
            if (a.date && b.date) {
                return new Date(a.date) - new Date(b.date);
            }
            return 0;
        });

        sortedTasks.forEach(task => {
            const taskItem = this.createTaskElement(task);
            taskList.appendChild(taskItem);
        });
    }

    createTaskElement(task) {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.dataset.id = task.id;

        const taskContent = document.createElement('div');
        taskContent.className = 'task-content';

        const taskText = document.createElement('div');
        taskText.className = 'task-text';
        taskText.textContent = task.text;

        const taskDate = document.createElement('div');
        taskDate.className = 'task-date';
        if (task.date) {
            const date = new Date(task.date);
            taskDate.textContent = `期限: ${date.toLocaleDateString('ja-JP')}`;
        } else {
            taskDate.textContent = '期限なし';
        }

        taskContent.appendChild(taskText);
        taskContent.appendChild(taskDate);

        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '10px';

        // 完了/未完了ボタン
        const completeBtn = document.createElement('button');
        completeBtn.textContent = task.completed ? '未完了に戻す' : '完了';
        completeBtn.style.cssText = `
            background: ${task.completed ? '#f39c12' : '#27ae60'};
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
        `;
        completeBtn.addEventListener('click', () => this.toggleComplete(task.id));

        // 削除ボタン
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '削除';
        deleteBtn.className = 'delete-btn';
        deleteBtn.addEventListener('click', () => this.deleteTask(task.id));

        buttonContainer.appendChild(completeBtn);
        buttonContainer.appendChild(deleteBtn);

        li.appendChild(taskContent);
        li.appendChild(buttonContainer);

        return li;
    }

    showError(message) {
        console.log('Showing error:', message);
        
        const errorMsg = document.querySelector('.error-msg');
        errorMsg.textContent = message;
        errorMsg.style.display = 'block';
        
        // 3秒後に非表示
        setTimeout(() => {
            this.hideError();
        }, 3000);
    }

    hideError() {
        const errorMsg = document.querySelector('.error-msg');
        errorMsg.style.display = 'none';
    }

    showSuccess(message) {
        console.log('Showing success:', message);
        
        // 成功メッセージを表示する要素を作成
        const successMsg = document.createElement('div');
        successMsg.textContent = message;
        successMsg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(successMsg);

        // 3秒後に削除
        setTimeout(() => {
            successMsg.remove();
        }, 3000);
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
        console.log('Tasks saved to localStorage');
    }

    // 統計情報を取得
    getStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(task => task.completed).length;
        const pending = total - completed;
        
        return { total, completed, pending };
    }

    // 全タスクを削除
    clearAllTasks() {
        if (confirm('全てのタスクを削除しますか？この操作は取り消せません。')) {
            this.tasks = [];
            this.saveTasks();
            this.renderTasks();
            this.showSuccess('全てのタスクが削除されました');
        }
    }
}

// アプリケーションを初期化
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    new TodoApp();
});

// アニメーション用のCSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);