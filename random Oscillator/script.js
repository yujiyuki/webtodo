// TodoアプリのJavaScript - IndexedDB版

class TodoApp {
    constructor() {
        console.log('TodoApp initialized with IndexedDB');
        this.dbName = 'TodoAppDB';
        this.dbVersion = 1;
        this.storeName = 'tasks';
        this.db = null;
        this.tasks = [];
        this.init();
    }

    async init() {
        console.log('Initializing TodoApp with IndexedDB');
        await this.openDatabase();
        await this.loadTasks();
        this.bindEvents();
        this.renderTasks();
        this.updateStats();
    }

    // IndexedDBデータベースを開く
    openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('データベースを開けませんでした:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDBデータベースが開かれました');
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // オブジェクトストアを作成
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const objectStore = db.createObjectStore(this.storeName, { 
                        keyPath: 'id', 
                        autoIncrement: false 
                    });
                    
                    // インデックスを作成
                    objectStore.createIndex('completed', 'completed', { unique: false });
                    objectStore.createIndex('date', 'date', { unique: false });
                    objectStore.createIndex('createdAt', 'createdAt', { unique: false });
                    
                    console.log('オブジェクトストアとインデックスが作成されました');
                }
            };
        });
    }

    // トランザクションを取得
    getTransaction(mode = 'readonly') {
        return this.db.transaction([this.storeName], mode);
    }

    // オブジェクトストアを取得
    getObjectStore(mode = 'readonly') {
        const transaction = this.getTransaction(mode);
        return transaction.objectStore(this.storeName);
    }

    // 全タスクを読み込む
    async loadTasks() {
        return new Promise((resolve, reject) => {
            const objectStore = this.getObjectStore('readonly');
            const request = objectStore.getAll();
            
            request.onsuccess = () => {
                this.tasks = request.result || [];
                console.log(`${this.tasks.length}個のタスクを読み込みました`);
                resolve(this.tasks);
            };
            
            request.onerror = () => {
                console.error('タスクの読み込みに失敗しました:', request.error);
                reject(request.error);
            };
        });
    }

    // タスクを保存
    async saveTask(task) {
        return new Promise((resolve, reject) => {
            const objectStore = this.getObjectStore('readwrite');
            const request = objectStore.put(task);
            
            request.onsuccess = () => {
                console.log('タスクが保存されました:', task);
                resolve(request.result);
            };
            
            request.onerror = () => {
                console.error('タスクの保存に失敗しました:', request.error);
                reject(request.error);
            };
        });
    }

    // タスクを削除
    async deleteTaskFromDB(taskId) {
        return new Promise((resolve, reject) => {
            const objectStore = this.getObjectStore('readwrite');
            const request = objectStore.delete(taskId);
            
            request.onsuccess = () => {
                console.log('タスクが削除されました:', taskId);
                resolve();
            };
            
            request.onerror = () => {
                console.error('タスクの削除に失敗しました:', request.error);
                reject(request.error);
            };
        });
    }

    // 全タスクを削除
    async clearAllTasksFromDB() {
        return new Promise((resolve, reject) => {
            const objectStore = this.getObjectStore('readwrite');
            const request = objectStore.clear();
            
            request.onsuccess = () => {
                console.log('全タスクが削除されました');
                resolve();
            };
            
            request.onerror = () => {
                console.error('全タスクの削除に失敗しました:', request.error);
                reject(request.error);
            };
        });
    }

    // 完了済みタスクを取得
    async getCompletedTasks() {
        return new Promise((resolve, reject) => {
            const objectStore = this.getObjectStore('readonly');
            const index = objectStore.index('completed');
            const request = index.getAll(true);
            
            request.onsuccess = () => {
                resolve(request.result || []);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // 日付でタスクを検索
    async getTasksByDate(date) {
        return new Promise((resolve, reject) => {
            const objectStore = this.getObjectStore('readonly');
            const index = objectStore.index('date');
            const request = index.getAll(date);
            
            request.onsuccess = () => {
                resolve(request.result || []);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
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

    async addTask() {
        console.log('addTask method called');
        
        const taskInput = document.querySelector('#task-input');
        const memoInput = document.querySelector('#memo-input');
        const dateInput = document.querySelector('#date');
        const errorMsg = document.querySelector('.error-msg');

        const taskText = taskInput.value.trim();
        const taskMemo = memoInput.value.trim();
        const taskDate = dateInput.value;

        console.log('Task text:', taskText);
        console.log('Task memo:', taskMemo);
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
            memo: taskMemo,
            date: taskDate,
            completed: false,
            createdAt: new Date().toISOString()
        };

        console.log('New task created:', newTask);

        try {
            // IndexedDBに保存
            await this.saveTask(newTask);
            
            // ローカル配列に追加
            this.tasks.push(newTask);

            // タスクリストを再描画
            this.renderTasks();

            // 統計を更新
            this.updateStats();

            // 入力フィールドをクリア
            taskInput.value = '';
            memoInput.value = '';
            dateInput.value = '';

            // 成功メッセージを表示
            this.showSuccess('タスクが追加されました！');
        } catch (error) {
            console.error('タスクの追加に失敗しました:', error);
            this.showError('タスクの追加に失敗しました');
        }
    }

    async deleteTask(taskId) {
        console.log('Deleting task:', taskId);
        
        if (confirm('このタスクを削除しますか？')) {
            try {
                // IndexedDBから削除
                await this.deleteTaskFromDB(taskId);
                
                // ローカル配列から削除
                this.tasks = this.tasks.filter(task => task.id !== taskId);
                
                this.renderTasks();
                this.updateStats();
                this.showSuccess('タスクが削除されました');
            } catch (error) {
                console.error('タスクの削除に失敗しました:', error);
                this.showError('タスクの削除に失敗しました');
            }
        }
    }

    async toggleComplete(taskId) {
        console.log('Toggling complete for task:', taskId);
        
        const task = this.tasks.find(task => task.id === taskId);
        if (task) {
            try {
                // 完了状態を切り替え
                task.completed = !task.completed;
                
                // IndexedDBに保存
                await this.saveTask(task);
                
                this.renderTasks();
                this.updateStats();
            } catch (error) {
                console.error('タスクの更新に失敗しました:', error);
                this.showError('タスクの更新に失敗しました');
            }
        }
    }

    updateStats() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(task => task.completed).length;
        
        const totalElement = document.getElementById('total-tasks');
        const completedElement = document.getElementById('completed-tasks');
        
        if (totalElement) {
            totalElement.textContent = totalTasks;
        }
        
        if (completedElement) {
            completedElement.textContent = completedTasks;
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

        const taskMemo = document.createElement('div');
        taskMemo.className = 'task-memo';
        if (task.memo && task.memo.trim()) {
            taskMemo.textContent = task.memo;
        }

        const taskDate = document.createElement('div');
        taskDate.className = 'task-date';
        if (task.date) {
            const date = new Date(task.date);
            taskDate.textContent = `期限: ${date.toLocaleDateString('ja-JP')}`;
        } else {
            taskDate.textContent = '期限なし';
        }

        taskContent.appendChild(taskText);
        taskContent.appendChild(taskMemo);
        taskContent.appendChild(taskDate);

        const taskActions = document.createElement('div');
        taskActions.className = 'task-actions';

        // 完了/未完了ボタン
        const completeBtn = document.createElement('button');
        completeBtn.textContent = task.completed ? '未完了に戻す' : '完了';
        completeBtn.className = `complete-btn ${task.completed ? 'completed' : ''}`;
        completeBtn.addEventListener('click', () => this.toggleComplete(task.id));

        // 削除ボタン
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '削除';
        deleteBtn.className = 'delete-btn';
        deleteBtn.addEventListener('click', () => this.deleteTask(task.id));

        taskActions.appendChild(completeBtn);
        taskActions.appendChild(deleteBtn);

        li.appendChild(taskContent);
        li.appendChild(taskActions);

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

    // 統計情報を取得
    getStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(task => task.completed).length;
        const pending = total - completed;
        
        return { total, completed, pending };
    }

    // 全タスクを削除
    async clearAllTasks() {
        if (confirm('全てのタスクを削除しますか？この操作は取り消せません。')) {
            try {
                await this.clearAllTasksFromDB();
                this.tasks = [];
                this.renderTasks();
                this.updateStats();
                this.showSuccess('全てのタスクが削除されました');
            } catch (error) {
                console.error('全タスクの削除に失敗しました:', error);
                this.showError('全タスクの削除に失敗しました');
            }
        }
    }

    // メモ付きタスクの検索
    searchTasksWithMemo() {
        return this.tasks.filter(task => task.memo && task.memo.trim());
    }

    // タスクの編集（メモの更新）
    async editTaskMemo(taskId, newMemo) {
        const task = this.tasks.find(task => task.id === taskId);
        if (task) {
            try {
                task.memo = newMemo;
                await this.saveTask(task);
                this.renderTasks();
                this.showSuccess('メモが更新されました');
            } catch (error) {
                console.error('メモの更新に失敗しました:', error);
                this.showError('メモの更新に失敗しました');
            }
        }
    }

    // データベースを削除（デバッグ用）
    async deleteDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.deleteDatabase(this.dbName);
            
            request.onsuccess = () => {
                console.log('データベースが削除されました');
                resolve();
            };
            
            request.onerror = () => {
                console.error('データベースの削除に失敗しました:', request.error);
                reject(request.error);
            };
        });
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