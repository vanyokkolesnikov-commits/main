import { useEffect, useMemo, useState } from 'react'
import {
  ACHIEVEMENTS,
  defaultMotivationState,
  getDailyQuote,
  getEligibleAchievementIds,
  getMotivationMessage,
  getProgressMetrics,
  getRecommendation,
  highestStreak,
  isNewPersonalRecord,
  type MotivationMessage,
  type MotivationState,
} from './motivation'

type IconName =
  | 'grid' | 'checklist' | 'calendar' | 'chart' | 'settings' | 'search'
  | 'plus' | 'arrow' | 'spark' | 'water' | 'book' | 'walk' | 'moon'
  | 'leaf' | 'clock' | 'check' | 'fire' | 'more' | 'edit' | 'trash'
  | 'close' | 'chevronLeft' | 'chevronRight' | 'sun' | 'target'
  | 'arrowUp' | 'dots' | 'bell' | 'download' | 'user' | 'empty'

type Habit = {
  id: string
  name: string
  category: string
  icon: IconName
  color: string
  completions: string[]
  createdAt: string
}

type Page = 'overview' | 'habits' | 'calendar' | 'insights' | 'settings'
type Theme = 'dark' | 'light'

const STORAGE_KEY = 'habitflow-data-v1'
const MOTIVATION_STORAGE_KEY = 'habitflow-motivation-v1'
const TODAY = dateKey(new Date())
const STARTER_SAMPLES = [
  { name: 'Стакан воды', category: 'Здоровье', icon: 'water' as const, color: 'blue' },
  { name: 'Читать 20 минут', category: 'Развитие', icon: 'book' as const, color: 'violet' },
  { name: 'Прогулка', category: 'Движение', icon: 'walk' as const, color: 'green' },
  { name: 'Вечер без экрана', category: 'Баланс', icon: 'moon' as const, color: 'amber' },
]

function dateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function shiftDate(date: Date, amount: number) {
  const shifted = new Date(date)
  shifted.setDate(shifted.getDate() + amount)
  return shifted
}

function useTodayKey() {
  const [today, setToday] = useState(() => dateKey(new Date()))
  useEffect(() => {
    const interval = window.setInterval(() => {
      const currentDate = dateKey(new Date())
      setToday((previousDate) => previousDate === currentDate ? previousDate : currentDate)
    }, 60_000)
    return () => window.clearInterval(interval)
  }, [])
  return today
}

function starterHabits(): Habit[] {
  return STARTER_SAMPLES.map((sample, index) => ({
    ...sample,
    id: `habit-${index + 1}`,
    completions: [],
    createdAt: TODAY,
  }))
}

function expectedStarterHistory(index: number, createdAt: string) {
  const history: string[] = []
  for (let daysAgo = 1; daysAgo <= 13; daysAgo += 1) {
    if ((daysAgo * 3 + index * 5) % 7 < 5) {
      history.push(dateKey(shiftDate(new Date(`${createdAt}T00:00:00`), -daysAgo)))
    }
  }
  if (index < 2) history.push(createdAt)
  return history.sort()
}

function removeUntouchedStarterHistory(habits: Habit[]) {
  return habits.map((habit) => {
    const index = STARTER_SAMPLES.findIndex((sample, sampleIndex) =>
      habit.id === `habit-${sampleIndex + 1}` &&
      habit.name === sample.name &&
      habit.category === sample.category &&
      habit.icon === sample.icon &&
      habit.color === sample.color,
    )
    if (index < 0 || habit.createdAt || habit.completions.length === 0) return habit

    const actual = [...habit.completions].sort()
    for (let daysAgo = 0; daysAgo <= 365; daysAgo += 1) {
      const seedDate = dateKey(shiftDate(new Date(), -daysAgo))
      const seeded = expectedStarterHistory(index, seedDate)
      if (actual.length === seeded.length && actual.every((date, dateIndex) => date === seeded[dateIndex])) {
        return { ...habit, completions: [], createdAt: seedDate }
      }
    }
    return habit
  })
}

function readSavedHabits(): Habit[] {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved) return starterHabits()
  const parsed: unknown = JSON.parse(saved)
  if (
    !Array.isArray(parsed) ||
    !parsed.every((habit) =>
      habit &&
      typeof habit.id === 'string' &&
      typeof habit.name === 'string' &&
      typeof habit.category === 'string' &&
      Array.isArray(habit.completions) &&
      habit.completions.every((date: unknown) => typeof date === 'string'),
    )
  ) {
    throw new Error('Сохранённые привычки HabitFlow имеют неверный формат.')
  }
  return removeUntouchedStarterHistory(parsed as Habit[]).map((habit) => ({
    ...habit,
    createdAt: habit.createdAt || TODAY,
  }))
}

function readMotivationState(habits: Habit[]): MotivationState {
  const saved = localStorage.getItem(MOTIVATION_STORAGE_KEY)
  const baseline = defaultMotivationState(habits)
  if (!saved) return baseline
  const parsed: unknown = JSON.parse(saved)
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !('achievements' in parsed) ||
    !parsed.achievements ||
    typeof parsed.achievements !== 'object' ||
    !('quoteHistory' in parsed) ||
    !Array.isArray(parsed.quoteHistory) ||
    !('messageHistory' in parsed) ||
    !Array.isArray(parsed.messageHistory) ||
    !('personalBest' in parsed) ||
    typeof parsed.personalBest !== 'number'
  ) {
    throw new Error('Сохранённые данные мотивации HabitFlow имеют неверный формат.')
  }
  const state = parsed as MotivationState
  return {
    ...state,
    personalBest: Math.max(state.personalBest, baseline.personalBest),
    lastRecordDate: typeof state.lastRecordDate === 'string' ? state.lastRecordDate : null,
  }
}

function readSetting<T>(key: string, fallback: T): T {
  const saved = localStorage.getItem(`habitflow-${key}`)
  return saved === null ? fallback : JSON.parse(saved) as T
}

function Icon({ name, size = 20, className }: { name: IconName; size?: number; className?: string }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    'aria-hidden': true as const,
  }
  const paths: Record<IconName, React.ReactNode> = {
    grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>,
    checklist: <><rect x="4" y="3.5" width="16" height="17" rx="2.5" /><path d="m8 9 1.5 1.5L12 8M14.5 9H17M8 15l1.5 1.5L12 14M14.5 15H17" /></>,
    calendar: <><rect x="3.5" y="5" width="17" height="16" rx="2.5" /><path d="M7.5 3v4M16.5 3v4M3.5 10h17M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01" /></>,
    chart: <><path d="M4 19.5h16M6.5 16v-4M11 16V7M15.5 16v-6M20 16V4.5" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1a1.8 1.8 0 1 1-2.5 2.5l-.1-.1a1.8 1.8 0 0 0-3 .9v.2a1.8 1.8 0 1 1-3.6 0v-.2a1.8 1.8 0 0 0-3-.9l-.1.1a1.8 1.8 0 1 1-2.5-2.5l.1-.1a1.8 1.8 0 0 0-.9-3H3.7a1.8 1.8 0 1 1 0-3.6h.2a1.8 1.8 0 0 0 .9-3l-.1-.1a1.8 1.8 0 1 1 2.5-2.5l.1.1a1.8 1.8 0 0 0 3-.9v-.2a1.8 1.8 0 1 1 3.6 0v.2a1.8 1.8 0 0 0 3 .9l.1-.1a1.8 1.8 0 1 1 2.5 2.5l-.1.1a1.8 1.8 0 0 0 .9 3h.2a1.8 1.8 0 1 1 0 3.6h-.2a1.8 1.8 0 0 0-.9 3Z" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3ZM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" /></>,
    water: <><path d="M12 3.5s-6 6.4-6 11a6 6 0 0 0 12 0c0-4.6-6-11-6-11Z" /><path d="M9 15.5a3 3 0 0 0 3 3" /></>,
    book: <><path d="M4.5 5.5A2.5 2.5 0 0 1 7 3h12.5v17H7a2.5 2.5 0 0 0-2.5 2v-16.5Z" /><path d="M4.5 18.5A2.5 2.5 0 0 1 7 16h12.5M9 7h6M9 10.5h5" /></>,
    walk: <><circle cx="14" cy="4.5" r="2" /><path d="m11 9 2.5 2 3-.5 2 2M11 9l-2 4-3 2M13.5 11l-1 4-3 4M12.5 15l4 2 2 3" /></>,
    moon: <path d="M20.5 15.3A8.5 8.5 0 0 1 8.7 3.5 8.5 8.5 0 1 0 20.5 15.3Z" />,
    leaf: <><path d="M20.5 3.5C11 3.5 4 6 4 13a6.5 6.5 0 0 0 6.5 6.5c7 0 9.5-7 10-16Z" /><path d="M3.5 21c3-5 7-8 12-10" /></>,
    clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.5 2" /></>,
    check: <path d="m5 12 4.5 4.5L19 7" />,
    fire: <path d="M12 22c4.4 0 7.5-3 7.5-7.2 0-3.2-1.8-5.5-4-7.8-.2 2-1.1 3-2 3.5.2-3-1.2-6-4-8-0.1 3.5-1.4 5.5-3.3 7.7C4.8 10 4 12.2 4 14.8 4 19 7.2 22 12 22Z" />,
    more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
    edit: <><path d="m15 5 4 4M4 20l4-.8L19 8a2.1 2.1 0 0 0-3-3L5 16l-1 4Z" /></>,
    trash: <><path d="M4 7h16M10 11v6M14 11v6M5.5 7l1 14h11l1-14M9 7V4h6v3" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    chevronLeft: <path d="m15 18-6-6 6-6" />,
    chevronRight: <path d="m9 18 6-6-6-6" />,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
    target: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" /></>,
    arrowUp: <><path d="M12 19V5M6 11l6-6 6 6" /></>,
    dots: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
    download: <><path d="M12 3v12m-5-5 5 5 5-5M4 20h16" /></>,
    user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
    empty: <><rect x="4" y="4" width="16" height="16" rx="4" /><path d="M8 12h8" /></>,
  }
  return <svg {...common}>{paths[name]}</svg>
}

const navigation: { id: Page; label: string; icon: IconName }[] = [
  { id: 'overview', label: 'Обзор', icon: 'grid' },
  { id: 'habits', label: 'Мои привычки', icon: 'checklist' },
  { id: 'calendar', label: 'Календарь', icon: 'calendar' },
  { id: 'insights', label: 'Аналитика', icon: 'chart' },
]

const monthFormat = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' })
const longDateFormat = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
const shortDateFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' })
const weekdayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function streakFor(habit: Habit) {
  const completed = new Set(habit.completions)
  let cursor = new Date()
  if (!completed.has(dateKey(cursor))) cursor = shiftDate(cursor, -1)
  let streak = 0
  while (completed.has(dateKey(cursor))) {
    streak += 1
    cursor = shiftDate(cursor, -1)
  }
  return streak
}

function doneFor(habit: Habit, day: string) {
  return habit.completions.includes(day)
}

function IconTile({ icon, color, size = 'normal' }: { icon: IconName; color: string; size?: 'normal' | 'small' }) {
  return <span className={`icon-tile ${color} ${size}`}><Icon name={icon} size={size === 'small' ? 18 : 21} /></span>
}

function App() {
  const today = useTodayKey()
  const [habits, setHabits] = useState<Habit[]>(() => readSavedHabits())
  const [motivationState, setMotivationState] = useState<MotivationState>(() => readMotivationState(habits))
  const [page, setPage] = useState<Page>('overview')
  const [theme, setTheme] = useState<Theme>(() => readSetting<Theme>('theme', 'dark'))
  const [userName, setUserName] = useState(() => readSetting<string>('name', 'Александр'))
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState(today)
  const [modalHabit, setModalHabit] = useState<Habit | null | undefined>(undefined)
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits))
  }, [habits])
  useEffect(() => {
    localStorage.setItem(MOTIVATION_STORAGE_KEY, JSON.stringify(motivationState))
  }, [motivationState])
  useEffect(() => {
    setSelectedDate(today)
  }, [today])
  useEffect(() => {
    setMotivationState((current) => {
      const eligible = getEligibleAchievementIds(habits, today, current.lastRecordDate)
      const nextAchievements = { ...current.achievements }
      let changed = false
      for (const id of eligible) {
        if (!nextAchievements[id]) {
          nextAchievements[id] = today
          changed = true
        }
      }
      return changed ? { ...current, achievements: nextAchievements } : current
    })
  }, [habits, today])
  useEffect(() => {
    localStorage.setItem('habitflow-theme', JSON.stringify(theme))
    document.documentElement.dataset.theme = theme
  }, [theme])
  useEffect(() => {
    localStorage.setItem('habitflow-name', JSON.stringify(userName))
  }, [userName])
  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(''), 2600)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const completedToday = habits.filter((habit) => doneFor(habit, today)).length
  const progress = habits.length ? Math.round((completedToday / habits.length) * 100) : 0
  const thisWeekDates = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date(`${today}T00:00:00`)
    const monday = shiftDate(date, -((date.getDay() + 6) % 7))
    return shiftDate(monday, index)
  }), [today])
  const filteredHabits = habits.filter((habit) =>
    `${habit.name} ${habit.category}`.toLowerCase().includes(query.toLowerCase()),
  )
  const dailyQuote = getDailyQuote(motivationState.quoteHistory, today)
  const motivationMessage = getMotivationMessage(habits, today, motivationState.lastRecordDate, motivationState.messageHistory)
  const recommendation = getRecommendation(habits, today)

  useEffect(() => {
    setMotivationState((current) => {
      const quoteHistory = current.quoteHistory.some((item) => item.date === today)
        ? current.quoteHistory
        : [...current.quoteHistory, { date: today, id: dailyQuote.id }].slice(-30)
      const messageExists = current.messageHistory.some(
        (item) => item.date === today && item.context === motivationMessage.context,
      )
      const messageHistory = messageExists
        ? current.messageHistory
        : [...current.messageHistory, { date: today, context: motivationMessage.context, id: motivationMessage.id }].slice(-30)
      if (quoteHistory === current.quoteHistory && messageHistory === current.messageHistory) return current
      return { ...current, quoteHistory, messageHistory }
    })
  }, [dailyQuote.id, motivationMessage.context, motivationMessage.id, today])

  function toggleHabit(id: string, day = today) {
    const habit = habits.find((item) => item.id === id)
    if (!habit) return
    const alreadyDone = doneFor(habit, day)
    const nextHabits = habits.map((habit) => {
      if (habit.id !== id) return habit
      return {
        ...habit,
        completions: alreadyDone
          ? habit.completions.filter((completion) => completion !== day)
          : [...habit.completions, day].sort(),
      }
    })
    setHabits(nextHabits)
    if (!alreadyDone) {
      const nextBest = highestStreak(nextHabits)
      setMotivationState((current) => {
        const newRecord = isNewPersonalRecord(current.personalBest, nextBest)
        return {
          ...current,
          personalBest: Math.max(current.personalBest, nextBest),
          lastRecordDate: newRecord ? today : current.lastRecordDate,
        }
      })
    }
    setToast(alreadyDone ? 'Отметка снята' : 'Привычка выполнена')
  }

  function saveHabit(name: string, category: string, color: string, icon: IconName, id?: string) {
    if (id) {
      setHabits((current) => current.map((habit) => habit.id === id ? { ...habit, name, category, color, icon } : habit))
      setToast('Изменения сохранены')
    } else {
      setHabits((current) => [{
        id: `habit-${Date.now()}`, name, category, color, icon, completions: [], createdAt: today,
      }, ...current])
      setToast('Привычка добавлена')
    }
    setModalHabit(undefined)
  }

  function deleteHabit(id: string) {
    const habit = habits.find((item) => item.id === id)
    if (!habit || !window.confirm(`Удалить привычку «${habit.name}» и её историю?`)) return
    setHabits((current) => current.filter((item) => item.id !== id))
    setModalHabit(undefined)
    setToast('Привычка удалена')
  }

  const pageTitles: Record<Page, string> = {
    overview: 'Обзор', habits: 'Мои привычки', calendar: 'Календарь',
    insights: 'Аналитика', settings: 'Настройки',
  }

  return (
    <div className={`app-shell ${theme}`}>
      <aside className="sidebar">
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); setPage('overview') }}>
          <span className="brand-mark"><Icon name="spark" size={22} /></span>
          <span>habit<span className="brand-light">flow</span></span>
        </a>
        <div className="side-label">МЕНЮ</div>
        <nav className="nav-list" aria-label="Основная навигация">
          {navigation.map((item) => (
            <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => setPage(item.id)}>
              <Icon name={item.icon} size={19} /><span>{item.label}</span>
              {item.id === 'habits' && <span className="nav-count">{habits.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className="focus-card">
          <div className="focus-orbit"><Icon name="spark" size={20} /></div>
          <p className="focus-eyebrow">Маленькие шаги</p>
          <p className="focus-title">создают большие перемены.</p>
          <span className="focus-caption">Продолжай в своём ритме</span>
          <div className="focus-line"><span /></div>
        </div>
        <button className={`nav-item settings-link ${page === 'settings' ? 'active' : ''}`} onClick={() => setPage('settings')}>
          <Icon name="settings" size={19} /><span>Настройки</span>
        </button>
        <div className="profile">
          <div className="avatar">{(userName.trim()[0] || 'А').toUpperCase()}</div>
          <div className="profile-copy"><strong>{userName || 'Ваш профиль'}</strong><span>Личный план</span></div>
          <Icon name="more" size={19} className="profile-more" />
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb"><span>Пространство</span><span className="breadcrumb-slash">/</span><strong>{pageTitles[page]}</strong></div>
          <div className="topbar-actions">
            <span className="today-label"><Icon name="calendar" size={16} />{longDateFormat.format(new Date())}</span>
            <span className="topbar-divider" />
            <button className="icon-button notification-button" aria-label="Уведомления" title="Уведомления"><Icon name="bell" size={19} /><i /></button>
            <button className="avatar avatar-small" onClick={() => setPage('settings')} aria-label="Открыть настройки">{(userName.trim()[0] || 'А').toUpperCase()}</button>
          </div>
        </header>

        <div className="page-content">
          {page === 'overview' && (
            <Dashboard
              habits={habits}
              userName={userName}
              today={today}
              progress={progress}
              completedToday={completedToday}
              week={thisWeekDates}
              motivationMessage={motivationMessage}
              recommendation={recommendation}
              dailyQuote={dailyQuote.text}
              achievements={motivationState.achievements}
              onToggle={toggleHabit}
              onAdd={() => setModalHabit(null)}
              onEdit={(habit) => setModalHabit(habit)}
              onNavigate={setPage}
            />
          )}
          {page === 'habits' && (
            <HabitsPage habits={filteredHabits} query={query} setQuery={setQuery} onToggle={toggleHabit} onAdd={() => setModalHabit(null)} onEdit={(habit) => setModalHabit(habit)} />
          )}
          {page === 'calendar' && (
            <CalendarPage
              habits={habits}
              month={calendarMonth}
              today={today}
              selectedDate={selectedDate}
              onMonthChange={setCalendarMonth}
              onSelectDate={setSelectedDate}
              onToggle={toggleHabit}
            />
          )}
          {page === 'insights' && <InsightsPage habits={habits} today={today} />}
          {page === 'settings' && <SettingsPage userName={userName} setUserName={setUserName} theme={theme} setTheme={setTheme} habits={habits} setHabits={setHabits} setToast={setToast} />}
        </div>
      </main>
      {modalHabit !== undefined && <HabitModal habit={modalHabit} onClose={() => setModalHabit(undefined)} onSave={saveHabit} onDelete={deleteHabit} />}
      {toast && <div className="toast"><span className="toast-check"><Icon name="check" size={15} /></span>{toast}</div>}
    </div>
  )
}

function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: React.ReactNode; description: string; action?: React.ReactNode }) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow"><span />{eyebrow}</div>
        <h1>{title}</h1>
        <p className="heading-description">{description}</p>
      </div>
      {action}
    </div>
  )
}

function Dashboard({
  habits, userName, today, progress, completedToday, week, motivationMessage, recommendation, dailyQuote,
  achievements, onToggle, onAdd, onEdit, onNavigate,
}: {
  habits: Habit[]
  userName: string
  today: string
  progress: number
  completedToday: number
  week: Date[]
  motivationMessage: MotivationMessage
  recommendation: string
  dailyQuote: string
  achievements: Record<string, string>
  onToggle: (id: string, day?: string) => void
  onAdd: () => void
  onEdit: (habit: Habit) => void
  onNavigate: (page: Page) => void
}) {
  const firstName = userName.trim().split(/\s+/)[0] || 'друг'
  const progressMetrics = getProgressMetrics(habits, today)
  const weeklyCount = progressMetrics.recentCount
  const weeklyDelta = progressMetrics.previousCount
    ? Math.round((weeklyCount - progressMetrics.previousCount) / progressMetrics.previousCount * 100)
    : null
  const bestStreak = Math.max(0, ...habits.map(streakFor))
  const unlockedCount = ACHIEVEMENTS.filter((achievement) => achievements[achievement.id]).length
  return (
    <>
      <PageHeading eyebrow={longDateFormat.format(new Date()).toUpperCase()} title={<>Добрый день, {firstName}<span className="heading-period">.</span></>} description="Новый день — ещё одна возможность стать ближе к себе." action={<button className="button button-primary" onClick={onAdd}><Icon name="plus" size={18} />Новая привычка</button>} />
      <section className="dashboard-hero">
        <div className="hero-copy">
          <span className="hero-kicker"><Icon name="spark" size={15} /> ВАШ РИТМ СЕГОДНЯ</span>
          <h2>Каждый шаг<br />имеет значение.</h2>
          <p>Вы уже сделали хорошее начало.<br className="desktop-break" /> Продолжайте — вы на верном пути.</p>
          <button className="hero-link" onClick={() => onNavigate('insights')}>Посмотреть прогресс <Icon name="arrow" size={16} /></button>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="hero-core"><div className="core-inner"><Icon name="spark" size={29} /></div></div>
          <span className="orbit-dot dot-one" /><span className="orbit-dot dot-two" /><span className="orbit-dot dot-three" />
          <span className="hero-art-caption">01 <span>—</span> YOUR DAILY PRACTICE</span>
        </div>
        <div className="hero-index">H / 01</div>
      </section>

      <section className="stats-row" aria-label="Статистика">
        <article className="stat-card progress-stat">
          <div className="stat-top"><span className="stat-label">Прогресс за день</span><span className="stat-icon violet"><Icon name="target" size={17} /></span></div>
          <div className="progress-stat-bottom">
            <div className="progress-copy"><strong>{progress}<small>%</small></strong><span>{completedToday} из {habits.length} привычек</span></div>
            <div className="progress-ring" style={{ '--progress': `${progress}%` } as React.CSSProperties}><span>{progress}<small>%</small></span></div>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-top"><span className="stat-label">Выполнено за 7 дней</span><span className="stat-icon blue"><Icon name="check" size={17} /></span></div>
          <div className="stat-number">{weeklyCount}<span>раз</span></div>
          <div className="stat-foot">
            {weeklyDelta === null
              ? <span>Пока нет данных для сравнения</span>
              : <><span className={`trend ${weeklyDelta < 0 ? 'trend-down' : ''}`}><Icon name="arrowUp" size={13} /> {weeklyDelta > 0 ? '+' : ''}{weeklyDelta}%</span><span>к предыдущим 7 дням</span></>}
          </div>
        </article>
        <article className="stat-card streak-stat">
          <div className="stat-top"><span className="stat-label">Лучшая серия</span><span className="stat-icon amber"><Icon name="fire" size={17} /></span></div>
          <div className="stat-number">{bestStreak}<span>дней</span></div>
          <div className="stat-foot"><span>Самое время побить рекорд</span></div>
        </article>
        <article className="stat-card week-stat">
          <div className="stat-top"><span className="stat-label">Эта неделя</span><button className="text-link" onClick={() => onNavigate('calendar')}>В календарь <Icon name="arrow" size={13} /></button></div>
          <div className="week-bars">
            {week.map((date) => {
              const key = dateKey(date)
              const count = habits.filter((habit) => doneFor(habit, key)).length
              const height = habits.length ? Math.max(count > 0 ? 13 : 4, Math.round((count / habits.length) * 33)) : 4
              return <div key={key} className="week-day"><div className="week-bar-track"><span className={key === today ? 'today-bar' : ''} style={{ height }} /></div><span className={key === today ? 'current-day' : ''}>{new Intl.DateTimeFormat('ru-RU', { weekday: 'short' }).format(date).replace('.', '')}</span></div>
            })}
          </div>
        </article>
      </section>

      <div className="support-row">
        <section className="motivation-card">
          <span className="support-icon"><Icon name="spark" size={19} /></span>
          <div className="support-copy">
            <span className="mini-eyebrow">ВАША ПОДДЕРЖКА СЕГОДНЯ</span>
            <h2>{motivationMessage.title}</h2>
            <p>{motivationMessage.text}</p>
          </div>
          <span className="motivation-progress">{progress}<small>%</small></span>
        </section>
        <section className="recommendation-card">
          <span className="recommendation-icon"><Icon name="leaf" size={18} /></span>
          <div><span className="mini-eyebrow">НЕБОЛЬШАЯ ИДЕЯ</span><p>{recommendation}</p></div>
        </section>
      </div>

      <section className="section-block">
        <div className="section-heading">
          <div><div className="section-title-row"><h2>Ваши привычки</h2><span className="count-pill">{habits.length}</span></div><p>Небольшие действия, из которых складывается день.</p></div>
          <button className="text-link desktop-link" onClick={() => onNavigate('habits')}>Все привычки <Icon name="arrow" size={15} /></button>
        </div>
        {habits.length === 0 ? <EmptyState onAdd={onAdd} /> : (
          <div className="habit-list">
            {habits.slice(0, 5).map((habit) => (
              <HabitRow key={habit.id} habit={habit} day={today} onToggle={() => onToggle(habit.id, today)} onEdit={() => onEdit(habit)} />
            ))}
            {habits.length > 5 && <button className="show-more" onClick={() => onNavigate('habits')}>Показать ещё {habits.length - 5} <Icon name="chevronRight" size={16} /></button>}
          </div>
        )}
      </section>
      <div className="dashboard-bottom">
        <section className="quote-card">
          <span className="quote-mark">“</span>
          <span className="quote-label">ЦИТАТА ДНЯ</span>
          <p>{dailyQuote}</p>
          <span className="quote-author">ВАШ ОРИЕНТИР НА СЕГОДНЯ <i /></span>
          <span className="quote-decoration" aria-hidden="true" />
        </section>
        <section className="weekly-card">
          <div className="weekly-card-head"><div><span className="mini-eyebrow">ВАША ПОСЛЕДОВАТЕЛЬНОСТЬ</span><h3>День за днём</h3></div><span className="weekly-total">{weeklyCount}<small> выполнений</small></span></div>
          <div className="heatmap">
            {Array.from({ length: 28 }, (_, index) => {
              const date = shiftDate(new Date(), -(27 - index))
              const key = dateKey(date)
              const count = habits.filter((habit) => doneFor(habit, key)).length
              return <span key={key} className={`heat-cell heat-${count === 0 ? 0 : count < 2 ? 1 : count < 4 ? 2 : 3}`} title={`${shortDateFormat.format(date)} · ${count} выполнено`} />
            })}
          </div>
          <div className="heatmap-labels"><span>4 недели назад</span><span>Сегодня</span></div>
        </section>
      </div>
      <section className="achievements-panel">
        <div className="section-heading">
          <div><div className="section-title-row"><h2>Ваши достижения</h2><span className="count-pill">{unlockedCount}/{ACHIEVEMENTS.length}</span></div><p>Они открываются сами — по мере вашего пути.</p></div>
        </div>
        <div className="achievements-grid">
          {ACHIEVEMENTS.map((achievement) => {
            const unlockedAt = achievements[achievement.id]
            return <article className={`achievement-card ${unlockedAt ? 'unlocked' : ''}`} key={achievement.id}>
              <span className="achievement-icon"><Icon name={achievement.icon} size={17} /></span>
              <div><strong>{achievement.title}</strong><span>{achievement.description}</span></div>
              <small>{unlockedAt ? 'Получено' : 'Впереди'}</small>
            </article>
          })}
        </div>
      </section>
    </>
  )
}

function HabitRow({ habit, onToggle, onEdit, day, showDate = false }: { habit: Habit; onToggle: () => void; onEdit: () => void; day?: string; showDate?: boolean }) {
  const activeDay = day ?? dateKey(new Date())
  const completed = doneFor(habit, activeDay)
  const streak = streakFor(habit)
  return (
    <article className={`habit-row ${completed ? 'completed' : ''}`}>
      <IconTile icon={habit.icon} color={habit.color} />
      <div className="habit-main"><h3>{habit.name}</h3><span>{habit.category}{showDate ? ` · ${shortDateFormat.format(new Date(`${activeDay}T00:00:00`))}` : ''}</span></div>
      <div className="habit-streak"><Icon name="fire" size={15} /><span>{streak} <small>дн.</small></span></div>
      <button className={`complete-button ${completed ? 'is-complete' : ''}`} onClick={onToggle} aria-label={completed ? `Снять отметку: ${habit.name}` : `Отметить: ${habit.name}`} title={completed ? 'Выполнено' : 'Отметить выполнение'}>
        {completed ? <Icon name="check" size={18} /> : <span />}
      </button>
      <button className="row-more" aria-label={`Редактировать ${habit.name}`} onClick={onEdit}><Icon name="more" size={19} /></button>
    </article>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return <div className="empty-state"><span className="empty-icon"><Icon name="leaf" size={23} /></span><strong>Начните с малого</strong><p>Добавьте первую привычку и задайте ритм своему дню.</p><button className="button button-primary" onClick={onAdd}><Icon name="plus" size={17} />Добавить привычку</button></div>
}

function HabitsPage({ habits, query, setQuery, onToggle, onAdd, onEdit }: {
  habits: Habit[]; query: string; setQuery: (value: string) => void
  onToggle: (id: string) => void; onAdd: () => void; onEdit: (habit: Habit) => void
}) {
  const completed = habits.filter((habit) => doneFor(habit, dateKey(new Date()))).length
  return (
    <>
      <PageHeading eyebrow="ВАШИ ЕЖЕДНЕВНЫЕ РИТУАЛЫ" title="Мои привычки" description="Создавайте ритм, который помогает вам расти." action={<button className="button button-primary" onClick={onAdd}><Icon name="plus" size={18} />Добавить привычку</button>} />
      <div className="page-summary"><div className="summary-mark"><Icon name="spark" size={20} /></div><div><strong>{completed} из {habits.length} выполнено сегодня</strong><span>Каждая отметка — маленькая победа над собой.</span></div><div className="summary-progress"><div><span style={{ width: `${habits.length ? completed / habits.length * 100 : 0}%` }} /></div><small>{habits.length ? Math.round(completed / habits.length * 100) : 0}%</small></div></div>
      <div className="list-toolbar"><div><h2>Все привычки <span className="count-pill">{habits.length}</span></h2><p>Ваш личный список на каждый день</p></div><label className="search-field"><Icon name="search" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Найти привычку" aria-label="Найти привычку" />{query && <button onClick={() => setQuery('')} aria-label="Очистить поиск"><Icon name="close" size={15} /></button>}</label></div>
      {habits.length ? <div className="habit-list full-list">{habits.map((habit) => <HabitRow key={habit.id} habit={habit} onToggle={() => onToggle(habit.id)} onEdit={() => onEdit(habit)} />)}</div> : <div className="empty-state"><span className="empty-icon"><Icon name="search" size={22} /></span><strong>Ничего не найдено</strong><p>Попробуйте изменить запрос или добавьте привычку.</p><button className="button button-secondary" onClick={onAdd}><Icon name="plus" size={17} />Добавить привычку</button></div>}
    </>
  )
}

function CalendarPage({ habits, month, today, selectedDate, onMonthChange, onSelectDate, onToggle }: {
  habits: Habit[]; month: Date; today: string; selectedDate: string; onMonthChange: (date: Date) => void
  onSelectDate: (date: string) => void; onToggle: (id: string, day?: string) => void
}) {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const offset = (new Date(year, monthIndex, 1).getDay() + 6) % 7
  const totalDays = new Date(year, monthIndex + 1, 0).getDate()
  const cells = Array.from({ length: Math.ceil((offset + totalDays) / 7) * 7 }, (_, index) => {
    const day = index - offset + 1
    return day > 0 && day <= totalDays ? new Date(year, monthIndex, day) : null
  })
  const selectedHabits = habits.filter((habit) => doneFor(habit, selectedDate))
  const selectedDateValue = new Date(`${selectedDate}T00:00:00`)
  return (
    <>
      <PageHeading eyebrow="ВАШИ МОМЕНТЫ ПОСЛЕДОВАТЕЛЬНОСТИ" title="Календарь" description="Каждая отметка — доказательство того, что вы можете." />
      <div className="calendar-layout">
        <section className="panel calendar-panel">
          <div className="calendar-header"><div><span className="mini-eyebrow">ИСТОРИЯ ПРИВЫЧЕК</span><h2>{monthFormat.format(month)}</h2></div><div className="month-controls"><button className="icon-button" aria-label="Предыдущий месяц" onClick={() => onMonthChange(new Date(year, monthIndex - 1, 1))}><Icon name="chevronLeft" size={18} /></button><button className="icon-button" aria-label="Следующий месяц" onClick={() => onMonthChange(new Date(year, monthIndex + 1, 1))}><Icon name="chevronRight" size={18} /></button></div></div>
          <div className="calendar-grid calendar-weekdays">{weekdayNames.map((day) => <span key={day}>{day}</span>)}</div>
          <div className="calendar-grid calendar-days">
            {cells.map((date, index) => {
              if (!date) return <span key={`empty-${index}`} className="calendar-day empty-day" />
              const key = dateKey(date)
              const count = habits.filter((habit) => doneFor(habit, key)).length
              const future = key > today
              return <button key={key} className={`calendar-day ${key === selectedDate ? 'selected' : ''} ${key === today ? 'is-today' : ''} ${future ? 'future' : ''}`} onClick={() => onSelectDate(key)} disabled={future}>
                <span>{date.getDate()}</span>
                <i className={`day-marker ${count ? `level-${Math.min(count, 3)}` : ''}`} />
              </button>
            })}
          </div>
          <div className="calendar-legend"><span><i className="legend-dot quiet" /> Нет отметок</span><span><i className="legend-dot active-dot" /> Есть прогресс</span></div>
        </section>
        <section className="panel day-detail">
          <div className="day-detail-head"><span className="mini-eyebrow">ВАШ ДЕНЬ</span><span className={`day-status ${selectedHabits.length ? 'status-done' : ''}`}><i />{selectedHabits.length ? 'Есть прогресс' : 'Без отметок'}</span></div>
          <div className="detail-date"><strong>{selectedDateValue.getDate()}</strong><div><span>{new Intl.DateTimeFormat('ru-RU', { weekday: 'long' }).format(selectedDateValue)}</span><small>{monthFormat.format(selectedDateValue)}</small></div></div>
          <div className="day-completion"><div className="day-completion-label"><span>Выполнено</span><strong>{selectedHabits.length}<small> / {habits.length}</small></strong></div><div className="linear-progress"><span style={{ width: `${habits.length ? selectedHabits.length / habits.length * 100 : 0}%` }} /></div></div>
          <div className="day-habits-label">ПРИВЫЧКИ ЭТОГО ДНЯ</div>
          {habits.length === 0 ? <p className="muted-copy">Добавьте привычки, чтобы начать отмечать прогресс.</p> : <div className="day-habit-list">
            {habits.map((habit) => <div className="day-habit" key={habit.id}><IconTile icon={habit.icon} color={habit.color} size="small" /><span>{habit.name}</span><button className={`mini-check ${doneFor(habit, selectedDate) ? 'checked' : ''}`} disabled={selectedDate > today} onClick={() => onToggle(habit.id, selectedDate)} aria-label={`${doneFor(habit, selectedDate) ? 'Снять отметку' : 'Отметить'}: ${habit.name}`}>{doneFor(habit, selectedDate) && <Icon name="check" size={13} />}</button></div>)}
          </div>}
          <div className="day-detail-foot"><Icon name="spark" size={15} /><span>Последовательность важнее идеала.</span></div>
        </section>
      </div>
    </>
  )
}

function InsightsPage({ habits, today }: { habits: Habit[]; today: string }) {
  const thisWeek = Array.from({ length: 7 }, (_, index) => shiftDate(new Date(`${today}T00:00:00`), index - 6))
  const previousWeek = Array.from({ length: 7 }, (_, index) => shiftDate(new Date(`${today}T00:00:00`), index - 13))
  const weekTotal = habits.reduce((sum, habit) => sum + thisWeek.filter((day) => doneFor(habit, dateKey(day))).length, 0)
  const prevTotal = habits.reduce((sum, habit) => sum + previousWeek.filter((day) => doneFor(habit, dateKey(day))).length, 0)
  const delta = prevTotal ? Math.round(((weekTotal - prevTotal) / prevTotal) * 100) : weekTotal ? 100 : 0
  const allCompletions = habits.reduce((sum, habit) => sum + habit.completions.length, 0)
  const bestStreak = Math.max(0, ...habits.map(streakFor))
  const maxDay = Math.max(1, ...thisWeek.map((day) => habits.filter((habit) => doneFor(habit, dateKey(day))).length))
  const strongestDay = thisWeek.reduce((best, day) => habits.filter((habit) => doneFor(habit, dateKey(day))).length > habits.filter((habit) => doneFor(habit, dateKey(best))).length ? day : best, thisWeek[0])
  return (
    <>
      <PageHeading eyebrow="ВАШ ПУТЬ В ЦИФРАХ" title="Аналитика" description="Взгляните на прогресс и отметьте, как далеко вы уже зашли." />
      <section className="insights-hero"><div><span className="hero-kicker"><Icon name="spark" size={15} /> ЭТА НЕДЕЛЯ</span><h2>Последовательность<br />становится привычкой.</h2><p>Вы делаете важную работу — продолжайте в своём темпе.</p></div><div className="insights-hero-number"><strong>{weekTotal}</strong><span>выполнений за неделю</span><div className={`insights-change ${delta < 0 ? 'negative' : ''}`}><Icon name={delta < 0 ? 'arrow' : 'arrowUp'} size={14} />{delta > 0 ? '+' : ''}{delta}%<small> к прошлой неделе</small></div></div></section>
      <section className="analytics-stats">
        <article className="stat-card"><div className="stat-top"><span className="stat-label">Всего отметок</span><span className="stat-icon blue"><Icon name="check" size={17} /></span></div><div className="stat-number">{allCompletions}<span>раз</span></div><div className="stat-foot"><span>Каждый раз — ваш выбор</span></div></article>
        <article className="stat-card"><div className="stat-top"><span className="stat-label">Лучшая серия</span><span className="stat-icon amber"><Icon name="fire" size={17} /></span></div><div className="stat-number">{bestStreak}<span>дней подряд</span></div><div className="stat-foot"><span>Продолжайте строить ритм</span></div></article>
        <article className="stat-card"><div className="stat-top"><span className="stat-label">Привычек в фокусе</span><span className="stat-icon violet"><Icon name="target" size={17} /></span></div><div className="stat-number">{habits.length}<span>активных</span></div><div className="stat-foot"><span>Небольшие шаги — большой путь</span></div></article>
      </section>
      <div className="analytics-grid">
        <section className="panel activity-panel"><div className="panel-heading"><div><span className="mini-eyebrow">ПОСЛЕДНИЕ 7 ДНЕЙ</span><h2>Активность</h2></div><span className="chart-total">{weekTotal}<small> выполнений</small></span></div><div className="activity-chart">
          {thisWeek.map((day) => {
            const count = habits.filter((habit) => doneFor(habit, dateKey(day))).length
            const height = Math.max(count ? 8 : 2, Math.round(count / maxDay * 100))
            return <div className="chart-column" key={dateKey(day)}><span className="chart-value">{count || ''}</span><div className="chart-track"><i className={dateKey(day) === today ? 'chart-bar today' : 'chart-bar'} style={{ height: `${height}%` }} /></div><span className={dateKey(day) === today ? 'chart-day active' : 'chart-day'}>{new Intl.DateTimeFormat('ru-RU', { weekday: 'short' }).format(day).replace('.', '')}</span></div>
          })}
        </div><div className="chart-note"><Icon name="spark" size={15} />Ваш самый активный день — <strong>{new Intl.DateTimeFormat('ru-RU', { weekday: 'long' }).format(strongestDay)}</strong></div></section>
        <section className="panel habits-insight"><div className="panel-heading"><div><span className="mini-eyebrow">ВАША ПОСЛЕДОВАТЕЛЬНОСТЬ</span><h2>В ритме</h2></div><Icon name="fire" size={19} className="subtle-fire" /></div>
          {habits.length ? <div className="insight-habit-list">{habits.slice().sort((a, b) => streakFor(b) - streakFor(a)).map((habit) => <div className="insight-habit" key={habit.id}><IconTile icon={habit.icon} color={habit.color} size="small" /><div><strong>{habit.name}</strong><span>текущая серия</span></div><b>{streakFor(habit)} <small>дн.</small></b></div>)}</div> : <p className="muted-copy">Добавьте привычки, чтобы увидеть статистику.</p>}
        </section>
      </div>
      <div className="insight-quote"><Icon name="spark" size={19} /><p>«Неважно, как медленно ты движешься, пока ты не останавливаешься.»</p><span>— КОНФУЦИЙ</span></div>
    </>
  )
}

function SettingsPage({ userName, setUserName, theme, setTheme, habits, setHabits, setToast }: {
  userName: string; setUserName: (value: string) => void; theme: Theme; setTheme: (value: Theme) => void
  habits: Habit[]; setHabits: (value: Habit[]) => void; setToast: (value: string) => void
}) {
  const [nameDraft, setNameDraft] = useState(userName)
  function saveName() {
    setUserName(nameDraft.trim() || 'Александр')
    setToast('Имя сохранено')
  }
  function exportData() {
    const content = JSON.stringify({ habits, exportedAt: new Date().toISOString() }, null, 2)
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([content], { type: 'application/json' }))
    link.download = 'habitflow-backup.json'
    link.click()
    URL.revokeObjectURL(link.href)
    setToast('Резервная копия скачана')
  }
  function clearHistory() {
    if (!window.confirm('Удалить все привычки и историю отметок? Это действие нельзя отменить.')) return
    setHabits([])
    setToast('Все привычки удалены')
  }
  return (
    <>
      <PageHeading eyebrow="ВАШЕ ПРОСТРАНСТВО" title="Настройки" description="Настройте HabitFlow так, чтобы он стал по-настоящему вашим." />
      <div className="settings-layout">
        <section className="panel settings-panel"><div className="settings-section-head"><div className="settings-icon"><Icon name="user" size={19} /></div><div><h2>Профиль</h2><p>Как к вам обращаться в приложении</p></div></div><label className="form-label" htmlFor="profile-name">Ваше имя</label><div className="settings-name-row"><input id="profile-name" className="form-input" value={nameDraft} maxLength={40} onChange={(event) => setNameDraft(event.target.value)} /><button className="button button-secondary" onClick={saveName}>Сохранить</button></div></section>
        <section className="panel settings-panel"><div className="settings-section-head"><div className="settings-icon"><Icon name="sun" size={19} /></div><div><h2>Внешний вид</h2><p>Выберите тему для своего пространства</p></div></div><div className="theme-options"><button className={`theme-option ${theme === 'dark' ? 'selected' : ''}`} onClick={() => setTheme('dark')}><span className="theme-preview dark-preview"><i /><i /><i /></span><span>Тёмная</span><span className="radio-dot" /></button><button className={`theme-option ${theme === 'light' ? 'selected' : ''}`} onClick={() => setTheme('light')}><span className="theme-preview light-preview"><i /><i /><i /></span><span>Светлая</span><span className="radio-dot" /></button></div></section>
        <section className="panel settings-panel"><div className="settings-section-head"><div className="settings-icon"><Icon name="download" size={19} /></div><div><h2>Ваши данные</h2><p>Ваши данные хранятся только в этом браузере</p></div></div><div className="data-action-row"><div><strong>Резервная копия</strong><span>Сохраните привычки и историю в файл</span></div><button className="button button-secondary" onClick={exportData}><Icon name="download" size={16} />Экспортировать</button></div><div className="data-action-row danger-row"><div><strong>Удалить все привычки</strong><span>Удалит ваши привычки и всю историю</span></div><button className="button button-danger" onClick={clearHistory}><Icon name="trash" size={16} />Удалить</button></div></section>
        <div className="settings-note"><Icon name="leaf" size={16} /><span>Ваш прогресс принадлежит вам. HabitFlow хранит данные локально и не передаёт их третьим лицам.</span></div>
      </div>
    </>
  )
}

function HabitModal({ habit, onClose, onSave, onDelete }: {
  habit: Habit | null; onClose: () => void
  onSave: (name: string, category: string, color: string, icon: IconName, id?: string) => void
  onDelete: (id: string) => void
}) {
  const [name, setName] = useState(habit?.name ?? '')
  const [category, setCategory] = useState(habit?.category ?? 'Здоровье')
  const [color, setColor] = useState(habit?.color ?? 'violet')
  const [icon, setIcon] = useState<IconName>(habit?.icon ?? 'leaf')
  const [error, setError] = useState('')
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])
  const colors = ['violet', 'blue', 'green', 'amber', 'rose']
  const icons: IconName[] = ['leaf', 'water', 'book', 'walk', 'moon', 'spark']
  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim()) {
      setError('Введите название привычки.')
      return
    }
    onSave(name.trim(), category, color, icon, habit?.id)
  }
  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="habit-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-header"><div><span className="mini-eyebrow">{habit ? 'НАСТРОЙТЕ СВОЙ РИТМ' : 'НОВЫЙ РИТУАЛ'}</span><h2 id="modal-title">{habit ? 'Изменить привычку' : 'Новая привычка'}</h2></div><button className="icon-button" onClick={onClose} aria-label="Закрыть"><Icon name="close" size={19} /></button></div>
        <form onSubmit={submit}>
          <label className="form-label" htmlFor="habit-name">Название</label><input id="habit-name" autoFocus maxLength={48} className="form-input" value={name} onChange={(event) => { setName(event.target.value); setError('') }} placeholder="Например, утренняя прогулка" />
          {error && <span className="field-error">{error}</span>}
          <label className="form-label" htmlFor="habit-category">Категория</label><select id="habit-category" className="form-input" value={category} onChange={(event) => setCategory(event.target.value)}><option>Здоровье</option><option>Развитие</option><option>Движение</option><option>Баланс</option><option>Осознанность</option><option>Другое</option></select>
          <span className="form-label">Иконка</span><div className="icon-picker">{icons.map((item) => <button key={item} type="button" className={`picker-icon ${icon === item ? 'selected' : ''}`} onClick={() => setIcon(item)} aria-label={`Выбрать иконку ${item}`}><Icon name={item} size={19} /></button>)}</div>
          <span className="form-label">Цвет</span><div className="color-picker">{colors.map((item) => <button key={item} type="button" className={`color-choice ${item} ${color === item ? 'selected' : ''}`} onClick={() => setColor(item)} aria-label={`Выбрать цвет ${item}`} />)}</div>
          <div className="modal-actions">{habit && <button type="button" className="button button-danger delete-modal" onClick={() => onDelete(habit.id)}><Icon name="trash" size={16} />Удалить</button>}<button type="button" className="button button-secondary" onClick={onClose}>Отмена</button><button type="submit" className="button button-primary">{habit ? 'Сохранить' : 'Добавить привычку'}</button></div>
        </form>
      </section>
    </div>
  )
}

export default App
