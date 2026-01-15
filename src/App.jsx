import { useState, useEffect } from 'react'
import './App.css'

// 백엔드 API 기본 URL
// .env 파일에서 환경 변수로 관리
// Vite에서는 VITE_ 접두사가 붙은 환경 변수만 클라이언트에서 접근 가능
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/todos'

// 환경 변수 확인 (개발 모드에서만 콘솔에 출력)
if (import.meta.env.DEV) {
  console.log('환경 변수 확인:')
  console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL)
  console.log('사용 중인 API_BASE_URL:', API_BASE_URL)
}

function App() {
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [newTodo, setNewTodo] = useState({ title: '', description: '' })
  const [editingId, setEditingId] = useState(null)
  const [editTodo, setEditTodo] = useState({ title: '', description: '' })

  // 모든 할일 조회
  const fetchTodos = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      // Content-Type 확인
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('서버가 JSON 형식이 아닌 응답을 반환했습니다. 백엔드 서버가 정상적으로 실행 중인지 확인해주세요.')
      }
      
      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch (parseError) {
          throw new Error(`서버 오류 (${response.status}): ${response.statusText}`)
        }
        throw new Error(errorData.error || '할일을 불러오는데 실패했습니다.')
      }
      
      const data = await response.json()
      setTodos(Array.isArray(data) ? data : [])
    } catch (err) {
      // 백엔드 연결 실패 시에도 UI는 표시되도록 에러만 설정
      const isNetworkError = err.message.includes('Failed to fetch') || 
                            err.message.includes('NetworkError') ||
                            err.message.includes('fetch') ||
                            err.message.includes('JSON') ||
                            err.message.includes('<!DOCTYPE')
      
      const errorMessage = isNetworkError
        ? '백엔드 서버에 연결할 수 없습니다. localhost:5000이 실행 중인지 확인해주세요.'
        : err.message || '할일을 불러오는데 실패했습니다.'
      
      setError(errorMessage)
      console.error('할일 조회 오류:', err)
      // 에러가 발생해도 빈 배열로 설정하여 UI가 표시되도록 함
      setTodos([])
    } finally {
      setLoading(false)
    }
  }

  // 할일 생성
  const createTodo = async (e) => {
    e.preventDefault()
    if (!newTodo.title.trim()) {
      setError('제목을 입력해주세요.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTodo),
      })

      // 네트워크 오류나 CORS 오류 확인
      if (!response) {
        throw new Error('네트워크 오류: 서버에 연결할 수 없습니다.')
      }

      // Content-Type 확인
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        // HTML 응답인 경우 (404 페이지 등)
        if (contentType && contentType.includes('text/html')) {
          throw new Error('백엔드 서버에 연결할 수 없습니다. API 경로가 올바른지 확인해주세요. (예: /todos)')
        }
        throw new Error('서버가 JSON 형식이 아닌 응답을 반환했습니다.')
      }

      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch (parseError) {
          throw new Error(`서버 오류 (${response.status}): ${response.statusText}`)
        }
        throw new Error(errorData.error || '할일 생성에 실패했습니다.')
      }

      const createdTodo = await response.json()
      setTodos([createdTodo, ...todos])
      setNewTodo({ title: '', description: '' })
    } catch (err) {
      // 네트워크 오류 감지
      const isNetworkError = err.message.includes('Failed to fetch') || 
                            err.message.includes('NetworkError') ||
                            err.message.includes('fetch') ||
                            err.message.includes('네트워크') ||
                            err.name === 'TypeError'
      
      // JSON 파싱 오류 감지
      const isJsonError = err.message.includes('JSON') || 
                         err.message.includes('<!DOCTYPE') ||
                         err.message.includes('Unexpected token')
      
      let errorMessage
      if (isNetworkError || isJsonError) {
        errorMessage = '백엔드 서버에 연결할 수 없습니다. 다음을 확인해주세요:\n1. localhost:5000이 실행 중인지\n2. API 경로가 올바른지 (예: /todos)\n3. CORS 설정이 올바른지'
      } else {
        errorMessage = err.message
      }
      
      setError(errorMessage)
      console.error('할일 생성 오류:', err)
    } finally {
      setLoading(false)
    }
  }

  // 할일 수정
  const updateTodo = async (id, updates) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      // Content-Type 확인
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('서버가 JSON 형식이 아닌 응답을 반환했습니다. 백엔드 서버가 정상적으로 실행 중인지 확인해주세요.')
      }

      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch (parseError) {
          throw new Error(`서버 오류 (${response.status}): ${response.statusText}`)
        }
        throw new Error(errorData.error || '할일 수정에 실패했습니다.')
      }

      const updatedTodo = await response.json()
      setTodos(todos.map(todo => todo._id === id ? updatedTodo : todo))
      setEditingId(null)
      setEditTodo({ title: '', description: '' })
    } catch (err) {
      const errorMessage = err.message.includes('JSON') || err.message.includes('<!DOCTYPE')
        ? '백엔드 서버에 연결할 수 없습니다. localhost:5000이 실행 중인지 확인해주세요.'
        : err.message
      setError(errorMessage)
      console.error('할일 수정 오류:', err)
    } finally {
      setLoading(false)
    }
  }

  // 할일 삭제
  const deleteTodo = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) {
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
      })

      // Content-Type 확인
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('서버가 JSON 형식이 아닌 응답을 반환했습니다. 백엔드 서버가 정상적으로 실행 중인지 확인해주세요.')
      }

      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch (parseError) {
          throw new Error(`서버 오류 (${response.status}): ${response.statusText}`)
        }
        throw new Error(errorData.error || '할일 삭제에 실패했습니다.')
      }

      setTodos(todos.filter(todo => todo._id !== id))
    } catch (err) {
      const errorMessage = err.message.includes('JSON') || err.message.includes('<!DOCTYPE')
        ? '백엔드 서버에 연결할 수 없습니다. localhost:5000이 실행 중인지 확인해주세요.'
        : err.message
      setError(errorMessage)
      console.error('할일 삭제 오류:', err)
    } finally {
      setLoading(false)
    }
  }

  // 완료 상태 토글
  const toggleComplete = async (id, currentCompleted) => {
    await updateTodo(id, { completed: !currentCompleted })
  }

  // 수정 모드 시작
  const startEdit = (todo) => {
    setEditingId(todo._id)
    setEditTodo({ title: todo.title, description: todo.description || '' })
  }

  // 수정 취소
  const cancelEdit = () => {
    setEditingId(null)
    setEditTodo({ title: '', description: '' })
  }

  // 수정 저장
  const saveEdit = (id) => {
    if (!editTodo.title.trim()) {
      setError('제목을 입력해주세요.')
      return
    }
    updateTodo(id, editTodo)
  }

  useEffect(() => {
    // 컴포넌트 마운트 시 할일 목록 불러오기
    // 에러가 발생해도 UI는 표시되도록 try-catch로 감싸기
    const loadTodos = async () => {
      try {
        await fetchTodos()
      } catch (err) {
        console.error('초기 데이터 로드 실패:', err)
        // 에러가 발생해도 UI는 표시되도록 함
        setLoading(false)
        setTodos([])
      }
    }
    loadTodos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="app">
      <div className="container">
        <h1>할일 관리</h1>

        {/* 에러 메시지 */}
        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {/* 할일 생성 폼 */}
        <form onSubmit={createTodo} className="todo-form">
          <div className="form-group">
            <input
              type="text"
              placeholder="할일 제목 *"
              value={newTodo.title}
              onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <textarea
              placeholder="설명 (선택사항)"
              value={newTodo.description}
              onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
              disabled={loading}
              rows="3"
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? '추가 중...' : '할일 추가'}
          </button>
        </form>

        {/* 할일 목록 */}
        <div className="todos-container">
          {loading && todos.length === 0 ? (
            <div className="loading">로딩 중...</div>
          ) : todos.length === 0 ? (
            <div className="empty-state">할일이 없습니다. 새로운 할일을 추가해보세요!</div>
          ) : (
            <ul className="todo-list">
              {todos.map((todo) => (
                <li key={todo._id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
                  {editingId === todo._id ? (
                    <div className="edit-form">
                      <input
                        type="text"
                        value={editTodo.title}
                        onChange={(e) => setEditTodo({ ...editTodo, title: e.target.value })}
                        className="edit-input"
                      />
                      <textarea
                        value={editTodo.description}
                        onChange={(e) => setEditTodo({ ...editTodo, description: e.target.value })}
                        className="edit-textarea"
                        rows="2"
                      />
                      <div className="edit-actions">
                        <button
                          onClick={() => saveEdit(todo._id)}
                          className="btn btn-small btn-primary"
                          disabled={loading}
                        >
                          저장
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="btn btn-small btn-secondary"
                          disabled={loading}
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="todo-content">
                        <input
                          type="checkbox"
                          checked={todo.completed || false}
                          onChange={() => toggleComplete(todo._id, todo.completed || false)}
                          className="todo-checkbox"
                        />
                        <div className="todo-text">
                          <h3 className={todo.completed ? 'completed-text' : ''}>
                            {todo.title}
                          </h3>
                          {todo.description && (
                            <p className={todo.completed ? 'completed-text' : ''}>
                              {todo.description}
                            </p>
                          )}
                          <span className="todo-date">
                            {new Date(todo.createdAt).toLocaleString('ko-KR')}
                          </span>
                        </div>
                      </div>
                      <div className="todo-actions">
                        <button
                          onClick={() => startEdit(todo)}
                          className="btn btn-small btn-edit"
                          disabled={loading}
                        >
                          수정
                        </button>
                        <button
                          onClick={() => deleteTodo(todo._id)}
                          className="btn btn-small btn-delete"
                          disabled={loading}
                        >
                          삭제
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default App

