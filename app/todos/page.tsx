'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { PremiumUpsell } from './components/PremiumUpsell'
import { AdSense } from '@/components/AdSense'
import { trackEvent } from '@/lib/todo-analytics'

interface Todo {
  id: string
  text: string
  completed: boolean
  createdAt: number
}

const FREE_TASK_LIMIT = 10

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [input, setInput] = useState('')
  const [isPremium, setIsPremium] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('todos')
    const premium = localStorage.getItem('isPremium') === 'true'
    if (saved) setTodos(JSON.parse(saved))
    setIsPremium(premium)
    
    // Track page view
    trackEvent.pageView('/todos')
  }, [])

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos))
  }, [todos])

  const addTodo = () => {
    if (!input.trim()) return
    
    // FREE TIER LIMIT CHECK 💰
    const activeTodos = todos.filter(t => !t.completed).length
    if (!isPremium && activeTodos >= FREE_TASK_LIMIT) {
      setShowUpgradeModal(true)
      trackEvent.hitPaywall('todo_limit')
      return
    }
    
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text: input,
      completed: false,
      createdAt: Date.now()
    }
    
    setTodos([newTodo, ...todos])
    setInput('')
    trackEvent.todoCreated()
  }

  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo => {
      if (todo.id === id) {
        const newCompleted = !todo.completed
        // Only track completion, not un-completion
        if (newCompleted) {
          trackEvent.todoCompleted()
        }
        return { ...todo, completed: newCompleted }
      }
      return todo
    }))
  }

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id))
    trackEvent.todoDeleted()
  }

  const clearCompleted = () => {
    setTodos(todos.filter(todo => !todo.completed))
  }

  const activeTasks = todos.filter(t => !t.completed).length
  const completedTasks = todos.filter(t => t.completed).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-950 dark:via-purple-950/20 dark:to-blue-950/20 p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header with Premium Badge */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            My Tasks
          </h1>
          {!isPremium && (
            <Button 
              onClick={() => setShowUpgradeModal(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              ⭐ Upgrade to Premium
            </Button>
          )}
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{activeTasks}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Active Tasks</div>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600">
              {isPremium ? '∞' : `${FREE_TASK_LIMIT - activeTasks}`}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {isPremium ? 'Unlimited' : 'Remaining'}
            </div>
          </div>
        </div>

        {/* Free Tier Limit Warning */}
        {!isPremium && activeTasks >= 8 && (
          <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 p-4 rounded-lg mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-yellow-800 dark:text-yellow-300">
                  ⚠️ Approaching Free Tier Limit
                </div>
                <div className="text-sm text-yellow-700 dark:text-yellow-400">
                  You have {FREE_TASK_LIMIT - activeTasks} tasks remaining. Upgrade for unlimited tasks!
                </div>
              </div>
              <Button 
                size="sm"
                onClick={() => setShowUpgradeModal(true)}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                Upgrade Now
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Todo Area */}
          <div className="lg:col-span-2">
            
            {/* Add Todo Input */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg mb-6">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                  placeholder="What needs to be done?"
                  className="flex-1 text-lg"
                />
                <Button onClick={addTodo} size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Add Task
                </Button>
              </div>
            </div>

            {/* Todo List */}
            <div className="space-y-3">
              {todos.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 p-12 rounded-lg shadow text-center text-gray-400">
                  <div className="text-6xl mb-4">📝</div>
                  <div className="text-xl">No tasks yet. Add one above!</div>
                </div>
              ) : (
                todos.map(todo => (
                  <div
                    key={todo.id}
                    className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={todo.completed}
                        onCheckedChange={() => toggleTodo(todo.id)}
                        className="h-5 w-5"
                      />
                      <span className={`flex-1 text-lg ${todo.completed ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                        {todo.text}
                      </span>
                      <div className="text-xs text-gray-400">
                        {new Date(todo.createdAt).toLocaleDateString()}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTodo(todo.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        🗑️
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Actions */}
            {todos.length > 0 && (
              <div className="mt-6 bg-white dark:bg-gray-900 p-4 rounded-lg shadow flex justify-between items-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {activeTasks} active • {completedTasks} completed
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearCompleted}
                  disabled={completedTasks === 0}
                >
                  Clear Completed
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar: Ads + Premium Upsell */}
          <div className="space-y-6">
            
            {/* Premium Features Teaser */}
            {!isPremium && (
              <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-6 rounded-lg shadow-lg text-white">
                <h3 className="text-xl font-bold mb-4">⭐ Premium Features</h3>
                <ul className="space-y-2 text-sm mb-4">
                  <li>✅ Unlimited tasks</li>
                  <li>✅ Cloud sync across devices</li>
                  <li>✅ Due dates & reminders</li>
                  <li>✅ Priority levels & tags</li>
                  <li>✅ Export to PDF/CSV</li>
                  <li>✅ Ad-free experience</li>
                  <li>✅ Blockchain verification</li>
                </ul>
                <Button 
                  onClick={() => setShowUpgradeModal(true)}
                  className="w-full bg-white text-purple-600 hover:bg-gray-100"
                >
                  Upgrade for $4.99/month
                </Button>
              </div>
            )}

            {/* AdSense (Free users only) */}
            {!isPremium && (
              <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow">
                <div className="text-xs text-gray-400 mb-2 text-center">Advertisement</div>
                <AdSense adSlot="todo-sidebar" />
              </div>
            )}

            {/* Productivity Tips */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
              <h3 className="font-bold mb-3 text-gray-800 dark:text-gray-200">💡 Productivity Tips</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li>• Start your day by planning 3 key tasks</li>
                <li>• Use the Pomodoro technique (25 min focus)</li>
                <li>• Review completed tasks weekly</li>
                <li>• Batch similar tasks together</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Upgrade Modal */}
      {showUpgradeModal && (
        <PremiumUpsell onClose={() => setShowUpgradeModal(false)} />
      )}

      {/* Bottom Ad (Free users) */}
      {!isPremium && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-2">
          <AdSense adSlot="todo-bottom" />
        </div>
      )}
    </div>
  )
}
