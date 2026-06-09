import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React, { useState } from 'react'

// ─────────────────────────────────────────────
// ВСПОМОГАТЕЛЬНЫЕ КОМПОНЕНТЫ (симуляция реальных)
// ─────────────────────────────────────────────

/** Упрощённая версия PasswordInput */
const PasswordInput = ({ value, onChange, placeholder = '••••••••', id }) => {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Пароль"
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        aria-label={visible ? 'Скрыть пароль' : 'Показать пароль'}
      >
        {visible ? 'Скрыть' : 'Показать'}
      </button>
    </div>
  )
}

/** Упрощённая версия CompleteButton */
const CompleteButton = ({ onComplete, alreadyDone = false }) => {
  const [done, setDone] = useState(alreadyDone)
  const [loading, setLoading] = useState(false)
  const [xpGained, setXpGained] = useState(null)
  const [showToast, setShowToast] = useState(false)

  const complete = async () => {
    setLoading(true)
    const result = await onComplete()
    setDone(true)
    setXpGained(result.xpGained)
    setShowToast(true)
    setLoading(false)
    setTimeout(() => setShowToast(false), 3000)
  }

  return (
    <>
      {showToast && xpGained != null && (
        <div role="alert">+{xpGained} XP баллы добавлены на счёт</div>
      )}
      {done ? (
        <div data-testid="lesson-done">✓ Урок пройден</div>
      ) : (
        <button onClick={complete} disabled={loading}>
          {loading ? 'Сохранение...' : 'Отметить пройденным'}
        </button>
      )}
    </>
  )
}

/** Упрощённая форма входа */
const LoginForm = ({ onSubmit }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await onSubmit({ email, password })
    if (!result.ok) setError(result.error)
    setLoading(false)
  }

  return (
    <form onSubmit={submit}>
      {error && <div role="alert">{error}</div>}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        aria-label="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Пароль"
        aria-label="Пароль"
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Вход...' : 'Войти'}
      </button>
    </form>
  )
}

/** Упрощённая форма регистрации */
const RegisterForm = ({ onSubmit }) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    const result = await onSubmit({ name, email, password })
    if (!result.ok) setError(result.error)
  }

  return (
    <form onSubmit={submit}>
      {error && <div role="alert">{error}</div>}
      <input
        aria-label="Имя"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Имя"
      />
      <input
        type="email"
        aria-label="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        aria-label="Пароль"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Пароль"
      />
      <button type="submit">Создать аккаунт</button>
    </form>
  )
}

/** XP-прогресс-бар */
const XPBar = ({ xp }) => {
  const level = Math.floor(xp / 100) + 1
  const progress = xp % 100
  return (
    <div>
      <span data-testid="level">Уровень {level}</span>
      <div
        data-testid="xp-bar"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{ width: `${progress}%` }}
      />
      <span data-testid="xp-value">{xp} XP</span>
    </div>
  )
}

/** Карточка значка */
const BadgeCard = ({ badge, earned }) => (
  <div data-testid="badge-card" style={{ opacity: earned ? 1 : 0.4 }}>
    <span data-testid="badge-icon">{badge.icon}</span>
    <span data-testid="badge-name">{badge.name}</span>
    <span data-testid="badge-xp">{badge.xpRequired} XP</span>
    {earned && <span data-testid="badge-earned">✓</span>}
  </div>
)

/** Карточка курса */
const CourseCard = ({ course, onClick }) => (
  <div data-testid="course-card" onClick={onClick} style={{ cursor: 'pointer' }}>
    <h3 data-testid="course-title">{course.title}</h3>
    <span data-testid="course-difficulty">{course.difficulty}</span>
    <span data-testid="course-xp">+{course.xpReward} XP</span>
    <span data-testid="course-lessons">{course.lessons?.length ?? 0} уроков</span>
  </div>
)

// ─────────────────────────────────────────────
// УТИЛИТЫ: чистые функции из бизнес-логики
// ─────────────────────────────────────────────

const calcLevel = (xp) => Math.min(99, Math.floor(xp / 100) + 1)
const calcProgress = (xp) => xp % 100
const isEmailValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
const isPasswordValid = (pwd) => pwd.length >= 6

// ─────────────────────────────────────────────
// 1. UNIT-ТЕСТЫ — чистая логика
// ─────────────────────────────────────────────

describe('Unit: Геймификация — расчёт уровня', () => {
  it('Уровень 1 при 0 XP', () => {
    expect(calcLevel(0)).toBe(1)
  })

  it('Уровень 2 при 100 XP', () => {
    expect(calcLevel(100)).toBe(2)
  })

  it('Уровень 5 при 400 XP', () => {
    expect(calcLevel(400)).toBe(5)
  })

  it('Не превышает максимум 99', () => {
    expect(calcLevel(10000)).toBe(99)
  })
})

describe('Unit: Геймификация — прогресс внутри уровня', () => {
  it('50 XP = 50% прогресса', () => {
    expect(calcProgress(50)).toBe(50)
  })

  it('150 XP = 50% прогресса (второй уровень)', () => {
    expect(calcProgress(150)).toBe(50)
  })

  it('200 XP = 0% (начало нового уровня)', () => {
    expect(calcProgress(200)).toBe(0)
  })
})

describe('Unit: Валидация email', () => {
  it('Корректный email проходит', () => {
    expect(isEmailValid('student@edu.ru')).toBe(true)
  })

  it('Email без @ не проходит', () => {
    expect(isEmailValid('student.edu.ru')).toBe(false)
  })

  it('Email без домена не проходит', () => {
    expect(isEmailValid('student@')).toBe(false)
  })
})

describe('Unit: Валидация пароля', () => {
  it('Пароль из 6+ символов валиден', () => {
    expect(isPasswordValid('password123')).toBe(true)
  })

  it('Пароль меньше 6 символов невалиден', () => {
    expect(isPasswordValid('123')).toBe(false)
  })

  it('Пустой пароль невалиден', () => {
    expect(isPasswordValid('')).toBe(false)
  })
})

// ─────────────────────────────────────────────
// 2. FEATURE-ТЕСТЫ — компоненты и взаимодействие
// ─────────────────────────────────────────────

describe('Feature: PasswordInput — показать/скрыть пароль', () => {
  it('По умолчанию поле типа password', () => {
    render(<PasswordInput value="" onChange={() => {}} />)
    expect(screen.getByLabelText('Пароль')).toHaveAttribute('type', 'password')
  })

  it('Клик "Показать" меняет тип на text', async () => {
    render(<PasswordInput value="" onChange={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: /показать/i }))
    expect(screen.getByLabelText('Пароль')).toHaveAttribute('type', 'text')
  })

  it('Повторный клик скрывает пароль', async () => {
    render(<PasswordInput value="" onChange={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: /показать/i }))
    await userEvent.click(screen.getByRole('button', { name: /скрыть/i }))
    expect(screen.getByLabelText('Пароль')).toHaveAttribute('type', 'password')
  })
})

describe('Feature: Форма входа', () => {
  it('Отображает кнопку "Войти"', () => {
    render(<LoginForm onSubmit={async () => ({ ok: true })} />)
    expect(screen.getByRole('button', { name: /войти/i })).toBeInTheDocument()
  })

  it('Показывает ошибку при неверных данных', async () => {
    render(
      <LoginForm
        onSubmit={async () => ({ ok: false, error: 'Неверный email или пароль' })}
      />
    )
    await userEvent.type(screen.getByLabelText('Email'), 'wrong@test.ru')
    await userEvent.type(screen.getByLabelText('Пароль'), 'wrongpass')
    await userEvent.click(screen.getByRole('button', { name: /войти/i }))
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Неверный email или пароль')
    )
  })

  it('Не показывает ошибку при успешном входе', async () => {
    render(<LoginForm onSubmit={async () => ({ ok: true })} />)
    await userEvent.type(screen.getByLabelText('Email'), 'student@edu.ru')
    await userEvent.type(screen.getByLabelText('Пароль'), 'password123')
    await userEvent.click(screen.getByRole('button', { name: /войти/i }))
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
  })
})

describe('Feature: Форма регистрации', () => {
  it('Содержит поля Имя, Email, Пароль', () => {
    render(<RegisterForm onSubmit={async () => ({ ok: true })} />)
    expect(screen.getByLabelText('Имя')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Пароль')).toBeInTheDocument()
  })

  it('Показывает ошибку, если email уже занят', async () => {
    render(
      <RegisterForm
        onSubmit={async () => ({
          ok: false,
          error: 'User with this email already exists',
        })}
      />
    )
    await userEvent.type(screen.getByLabelText('Имя'), 'Иван')
    await userEvent.type(screen.getByLabelText('Email'), 'student@edu.ru')
    await userEvent.type(screen.getByLabelText('Пароль'), 'password123')
    await userEvent.click(screen.getByRole('button', { name: /создать аккаунт/i }))
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('already exists')
    )
  })
})

describe('Feature: CompleteButton — прохождение урока', () => {
  it('Показывает кнопку "Отметить пройденным"', () => {
    render(<CompleteButton onComplete={async () => ({ xpGained: 10 })} />)
    expect(screen.getByRole('button', { name: /отметить пройденным/i })).toBeInTheDocument()
  })

  it('После клика показывает "Урок пройден"', async () => {
    render(<CompleteButton onComplete={async () => ({ xpGained: 10 })} />)
    await userEvent.click(screen.getByRole('button'))
    await waitFor(() =>
      expect(screen.getByTestId('lesson-done')).toBeInTheDocument()
    )
  })

  it('Toast отображает начисленные XP', async () => {
    render(<CompleteButton onComplete={async () => ({ xpGained: 25 })} />)
    await userEvent.click(screen.getByRole('button'))
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('+25 XP')
    )
  })
})

describe('Feature: XPBar — отображение прогресса', () => {
  it('Отображает уровень', () => {
    render(<XPBar xp={150} />)
    expect(screen.getByTestId('level')).toHaveTextContent('Уровень 2')
  })

  it('Прогресс-бар имеет корректное значение', () => {
    render(<XPBar xp={150} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50')
  })

  it('Отображает суммарный XP', () => {
    render(<XPBar xp={350} />)
    expect(screen.getByTestId('xp-value')).toHaveTextContent('350 XP')
  })
})

describe('Feature: BadgeCard — значки', () => {
  const badge = { icon: '🏅', name: 'Первые шаги', xpRequired: 10 }

  it('Отображает иконку и название значка', () => {
    render(<BadgeCard badge={badge} earned={false} />)
    expect(screen.getByTestId('badge-icon')).toHaveTextContent('🏅')
    expect(screen.getByTestId('badge-name')).toHaveTextContent('Первые шаги')
  })

  it('Полученный значок показывает галочку', () => {
    render(<BadgeCard badge={badge} earned={true} />)
    expect(screen.getByTestId('badge-earned')).toBeInTheDocument()
  })

  it('Неполученный значок не имеет галочки', () => {
    render(<BadgeCard badge={badge} earned={false} />)
    expect(screen.queryByTestId('badge-earned')).not.toBeInTheDocument()
  })

  it('Отображает порог XP для получения', () => {
    render(<BadgeCard badge={badge} earned={false} />)
    expect(screen.getByTestId('badge-xp')).toHaveTextContent('10 XP')
  })
})

describe('Feature: CourseCard — карточка курса', () => {
  const course = {
    title: 'Основы математики',
    difficulty: 'beginner',
    xpReward: 100,
    lessons: [{}, {}, {}],
  }

  it('Отображает название курса', () => {
    render(<CourseCard course={course} onClick={() => {}} />)
    expect(screen.getByTestId('course-title')).toHaveTextContent('Основы математики')
  })

  it('Отображает сложность', () => {
    render(<CourseCard course={course} onClick={() => {}} />)
    expect(screen.getByTestId('course-difficulty')).toHaveTextContent('beginner')
  })

  it('Отображает награду XP', () => {
    render(<CourseCard course={course} onClick={() => {}} />)
    expect(screen.getByTestId('course-xp')).toHaveTextContent('+100 XP')
  })

  it('Отображает количество уроков', () => {
    render(<CourseCard course={course} onClick={() => {}} />)
    expect(screen.getByTestId('course-lessons')).toHaveTextContent('3 уроков')
  })

  it('Вызывает onClick при клике', async () => {
    const handleClick = jest.fn()
    render(<CourseCard course={course} onClick={handleClick} />)
    await userEvent.click(screen.getByTestId('course-card'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
