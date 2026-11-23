export type HabitProgress = {
  id: string
  name: string
  completions: string[]
  createdAt?: string
}

export type MotivationMessage = {
  id: string
  context: string
  title: string
  text: string
}

export type MessageHistoryItem = {
  date: string
  context: string
  id: string
}

export type QuoteHistoryItem = {
  date: string
  id: string
}

export type MotivationState = {
  achievements: Record<string, string>
  personalBest: number
  lastRecordDate: string | null
  quoteHistory: QuoteHistoryItem[]
  messageHistory: MessageHistoryItem[]
}

export type Achievement = {
  id: string
  title: string
  description: string
  icon: 'check' | 'fire' | 'spark' | 'target'
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-completion', title: 'Первый шаг', description: 'Выполнена первая привычка', icon: 'check' },
  { id: 'streak-3', title: 'В ритме', description: 'Одна привычка 3 дня подряд', icon: 'fire' },
  { id: 'streak-7', title: 'Неделя силы', description: 'Одна привычка 7 дней подряд', icon: 'fire' },
  { id: 'streak-14', title: 'Две недели', description: 'Одна привычка 14 дней подряд', icon: 'fire' },
  { id: 'streak-30', title: 'Месяц с собой', description: 'Одна привычка 30 дней подряд', icon: 'fire' },
  { id: 'completion-100', title: 'Сотня шагов', description: 'Выполнено 100 привычек', icon: 'target' },
  { id: 'daily-master', title: 'День в балансе', description: 'Все привычки выполнены за день', icon: 'spark' },
  { id: 'comeback', title: 'С возвращением', description: 'Продолжили после долгой паузы', icon: 'spark' },
  { id: 'personal-record', title: 'Новый рекорд', description: 'Личная серия стала длиннее', icon: 'target' },
]

export const DAILY_QUOTES: { id: string; text: string }[] = [
  { id: 'q01', text: 'Большие перемены начинаются с шага, который можно сделать сегодня.' },
  { id: 'q02', text: 'Постоянство не требует идеальных дней — только следующего шага.' },
  { id: 'q03', text: 'Тихий прогресс всё равно ведёт вперёд.' },
  { id: 'q04', text: 'Выбирая свой ритм, ты уже строишь опору.' },
  { id: 'q05', text: 'Не скорость определяет путь, а готовность продолжать.' },
  { id: 'q06', text: 'Небольшое действие сегодня — подарок себе завтрашнему.' },
  { id: 'q07', text: 'Дисциплина растёт там, где ты снова выбираешь важное.' },
  { id: 'q08', text: 'Начать заново — тоже часть пути вперёд.' },
  { id: 'q09', text: 'Один осознанный выбор может задать тон всему дню.' },
  { id: 'q10', text: 'Цели становятся ближе, когда получают место в обычном дне.' },
  { id: 'q11', text: 'Верность маленьким обещаниям укрепляет большие намерения.' },
  { id: 'q12', text: 'Сделай сегодня немного — и позволь этому быть достаточно.' },
  { id: 'q13', text: 'Развитие начинается с любопытства к тому, кем ты можешь стать.' },
  { id: 'q14', text: 'Каждое возвращение к цели — это уже проявление силы.' },
  { id: 'q15', text: 'Привычки превращают ценности в действия.' },
  { id: 'q16', text: 'Мягкий, устойчивый шаг сильнее редкого рывка.' },
  { id: 'q17', text: 'Сегодняшняя забота о себе складывается в завтрашнюю уверенность.' },
  { id: 'q18', text: 'Сосредоточься на следующем шаге, а не на всём пути сразу.' },
  { id: 'q19', text: 'Пусть цель будет смелой, а сегодняшний шаг — посильным.' },
  { id: 'q20', text: 'Устойчивость рождается не из безошибочности, а из возвращения.' },
  { id: 'q21', text: 'Твоё внимание — начало перемен, которые ты выбираешь.' },
  { id: 'q22', text: 'Маленькая привычка может стать тихой точкой опоры.' },
  { id: 'q23', text: 'У каждого дня есть место для одного хорошего решения.' },
  { id: 'q24', text: 'Результат строится в те дни, когда ты просто продолжаешь.' },
  { id: 'q25', text: 'Путь к цели становится яснее с каждым честным шагом.' },
  { id: 'q26', text: 'Тебе не нужно быть идеальным, чтобы двигаться вперёд.' },
  { id: 'q27', text: 'Пусть привычка будет не обязанностью, а способом поддержать себя.' },
  { id: 'q28', text: 'Повторённый выбор однажды становится частью тебя.' },
  { id: 'q29', text: 'Спокойный прогресс — тоже прогресс.' },
  { id: 'q30', text: 'Сделай начало простым, чтобы продолжение стало возможным.' },
]

const MESSAGE_GROUPS = {
  record: [
    { id: 'record-1', title: 'Вы установили личный рекорд!', text: 'Ваша серия стала длиннее. Это результат вашего постоянства — отличный повод собой гордиться.' },
    { id: 'record-2', title: 'Новая личная вершина.', text: 'Вы превзошли свою лучшую серию. Пусть сегодняшний шаг будет просто следующим, а не обязательством повторить рекорд.' },
  ],
  comeback: [
    { id: 'comeback-1', title: 'Рады, что вы вернулись.', text: 'После паузы не нужно наверстывать всё сразу. Выберите один небольшой шаг — этого достаточно для начала.' },
    { id: 'comeback-2', title: 'Хорошо снова видеть вас здесь.', text: 'Перерыв не отменяет ваш путь. Сегодня можно просто продолжить с того места, где вам удобно.' },
    { id: 'comeback-3', title: 'Вы снова выбрали себя.', text: 'Возвращение уже само по себе важный шаг. Начните с одной привычки и двигайтесь в своём темпе.' },
  ],
  all: [
    { id: 'all-1', title: 'Вы сделали всё, что задумали.', text: 'Все привычки на сегодня выполнены. Заметьте этот результат — он целиком ваш.' },
    { id: 'all-2', title: 'Сегодняшний план закрыт.', text: 'Вы уделили время каждому своему намерению. Отличная работа — теперь можно выдохнуть.' },
    { id: 'all-3', title: 'Полный день маленьких побед.', text: 'Все привычки выполнены. Последовательность складывается именно из таких дней.' },
  ],
  week: [
    { id: 'week-1', title: 'Вы прибавили за неделю.', text: 'За последние семь дней отметок больше, чем за предыдущие. Ваши усилия начинают складываться в ритм.' },
    { id: 'week-2', title: 'Прогресс заметен.', text: 'Неделя получилась активнее предыдущей. Продолжайте в таком темпе, который подходит именно вам.' },
  ],
  partial: [
    { id: 'partial-1', title: 'Хорошее начало дня.', text: 'Часть привычек уже позади. Выберите следующую, когда будете готовы — без спешки.' },
    { id: 'partial-2', title: 'Вы уже двигаетесь вперёд.', text: 'Одна выполненная привычка — это реальный шаг. Остальное можно делать постепенно.' },
    { id: 'partial-3', title: 'Продолжайте в своём ритме.', text: 'Сегодня уже есть прогресс. Если найдётся время и силы, следующая небольшая задача ждёт вас.' },
  ],
  lost: [
    { id: 'lost-1', title: 'Серия прервалась, но путь продолжается.', text: 'Пропуск не обнуляет ваши старания. Можно начать новую серию с одного спокойного шага.' },
    { id: 'lost-2', title: 'Бывает по-разному — и это нормально.', text: 'Ваша прежняя серия всё равно была достижением. Когда будете готовы, продолжайте без чувства вины.' },
  ],
  missed: [
    { id: 'missed-1', title: 'Можно вернуться с малого.', text: 'После паузы не нужно наверстывать пропущенное. Одна простая привычка — уже хороший план на сегодня.' },
    { id: 'missed-2', title: 'Начните там, где вы сейчас.', text: 'Неважно, сколько дней прошло. Выберите самое лёгкое действие и позвольте ритму вернуться постепенно.' },
    { id: 'missed-3', title: 'Ваш темп может быть разным.', text: 'Несколько пропущенных дней не определяют ваш путь. Сегодня достаточно одного небольшого шага.' },
  ],
  start: [
    { id: 'start-1', title: 'Начните с одной привычки.', text: 'Не нужно менять весь день сразу. Выберите то, что сейчас проще всего выполнить.' },
    { id: 'start-2', title: 'Для начала хватит малого.', text: 'Пять минут, стакан воды или короткая прогулка — пусть первое действие будет посильным.' },
    { id: 'start-3', title: 'Сегодня — чистый лист.', text: 'Выберите одну привычку и сделайте её в удобное время. Хороший ритм начинается спокойно.' },
  ],
} as const

function uniqueDates(habit: HabitProgress) {
  return [...new Set(habit.completions)].filter(isDateKey).sort()
}

function isDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
}

export function shiftDateKey(date: string, days: number) {
  const [year, month, day] = date.split('-').map(Number)
  const shifted = new Date(Date.UTC(year, month - 1, day))
  shifted.setUTCDate(shifted.getUTCDate() + days)
  return shifted.toISOString().slice(0, 10)
}

export function daysBetween(from: string, to: string) {
  const [fromYear, fromMonth, fromDay] = from.split('-').map(Number)
  const [toYear, toMonth, toDay] = to.split('-').map(Number)
  return Math.round((Date.UTC(toYear, toMonth - 1, toDay) - Date.UTC(fromYear, fromMonth - 1, fromDay)) / 86_400_000)
}

export function longestStreak(habit: HabitProgress) {
  let longest = 0
  let current = 0
  let previous: string | undefined
  for (const date of uniqueDates(habit)) {
    current = previous && daysBetween(previous, date) === 1 ? current + 1 : 1
    longest = Math.max(longest, current)
    previous = date
  }
  return longest
}

export function currentStreak(habit: HabitProgress, today: string) {
  const completed = new Set(uniqueDates(habit))
  let cursor = completed.has(today) ? today : shiftDateKey(today, -1)
  let streak = 0
  while (completed.has(cursor)) {
    streak += 1
    cursor = shiftDateKey(cursor, -1)
  }
  return streak
}

export function highestStreak(habits: HabitProgress[]) {
  return Math.max(0, ...habits.map(longestStreak))
}

export function isNewPersonalRecord(previousBest: number, nextBest: number) {
  return nextBest > previousBest && (previousBest > 0 || nextBest >= 3)
}

export function getProgressMetrics(habits: HabitProgress[], today: string) {
  const allDates = [...new Set(habits.flatMap(uniqueDates))].sort()
  const previousActivity = allDates.filter((date) => date < today).at(-1)
  const lastActivity = allDates.at(-1)
  const todayCount = habits.filter((habit) => uniqueDates(habit).includes(today)).length
  const lastSevenDays = Array.from({ length: 7 }, (_, index) => shiftDateKey(today, index - 6))
  const previousSevenDays = Array.from({ length: 7 }, (_, index) => shiftDateKey(today, index - 13))
  const countForDays = (days: string[]) => habits.reduce(
    (total, habit) => total + uniqueDates(habit).filter((date) => days.includes(date)).length,
    0,
  )
  const recentCount = countForDays(lastSevenDays)
  const previousCount = countForDays(previousSevenDays)
  const lostStreak = habits.some((habit) => {
    const dates = uniqueDates(habit)
    const lastDate = dates.at(-1)
    return Boolean(
      lastDate &&
      !dates.includes(today) &&
      daysBetween(lastDate, today) >= 2 &&
      longestStreak(habit) >= 3,
    )
  })
  const missedDays = lastActivity && lastActivity < today ? daysBetween(lastActivity, today) - 1 : 0
  return {
    todayCount,
    todayPercent: habits.length ? Math.round((todayCount / habits.length) * 100) : 0,
    recentCount,
    previousCount,
    weeklyImproved: recentCount > previousCount,
    weeklyDeclined: previousCount > 0 && recentCount < previousCount,
    daysSinceActivity: lastActivity ? daysBetween(lastActivity, today) : null,
    daysSincePreviousActivity: previousActivity ? daysBetween(previousActivity, today) : null,
    missedDays,
    missedSeveralDays: todayCount === 0 && missedDays >= 2,
    returningAfterBreak: todayCount > 0 && previousActivity !== undefined && daysBetween(previousActivity, today) >= 4,
    lostStreak: lostStreak && missedDays < 3,
    bestStreak: highestStreak(habits),
    currentStreak: Math.max(0, ...habits.map((habit) => currentStreak(habit, today))),
    totalCompletions: habits.reduce((total, habit) => total + uniqueDates(habit).length, 0),
  }
}

export function getMotivationMessage(
  habits: HabitProgress[],
  today: string,
  lastRecordDate: string | null,
  history: MessageHistoryItem[],
): MotivationMessage {
  const metrics = getProgressMetrics(habits, today)
  let group: keyof typeof MESSAGE_GROUPS
  let context: string

  if (lastRecordDate === today) {
    group = 'record'
    context = `record:${today}`
  } else if (metrics.returningAfterBreak) {
    group = 'comeback'
    context = `comeback:${metrics.todayCount}:${metrics.daysSincePreviousActivity}`
  } else if (habits.length > 0 && metrics.todayCount === habits.length) {
    group = 'all'
    context = `all:${habits.length}`
  } else if (metrics.todayCount === 0 && metrics.missedSeveralDays) {
    group = 'missed'
    context = `missed:${Math.min(metrics.missedDays, 7)}`
  } else if (metrics.todayCount === 0 && metrics.lostStreak) {
    group = 'lost'
    context = `lost:${metrics.bestStreak}:${metrics.daysSinceActivity}`
  } else if (metrics.todayCount === 0) {
    group = 'start'
    context = habits.length ? 'start:habits' : 'start:empty'
  } else if (metrics.weeklyImproved) {
    group = 'week'
    context = `week:${metrics.recentCount}:${metrics.previousCount}`
  } else {
    group = 'partial'
    context = `partial:${metrics.todayCount}:${habits.length}`
  }

  const existing = history.find((item) => item.date === today && item.context === context)
  const messages = MESSAGE_GROUPS[group]
  if (existing) {
    const savedMessage = messages.find((message) => message.id === existing.id)
    if (savedMessage) return { ...savedMessage, context }
  }

  const recentlyShown = new Set(history.slice(-5).map((item) => item.id))
  const available = messages.filter((message) => !recentlyShown.has(message.id))
  const options = available.length ? available : messages
  const seed = [...`${today}:${context}`].reduce((total, character) => total + character.charCodeAt(0), 0)
  return { ...options[seed % options.length], context }
}

export function getDailyQuote(history: QuoteHistoryItem[], today: string) {
  const existing = history.find((item) => item.date === today)
  const savedQuote = existing && DAILY_QUOTES.find((quote) => quote.id === existing.id)
  if (savedQuote) return savedQuote

  const recentlyShown = new Set(history.slice(-5).map((item) => item.id))
  const seed = [...today].reduce((total, character) => total + character.charCodeAt(0), 0)
  for (let offset = 0; offset < DAILY_QUOTES.length; offset += 1) {
    const quote = DAILY_QUOTES[(seed + offset) % DAILY_QUOTES.length]
    if (!recentlyShown.has(quote.id)) return quote
  }
  return DAILY_QUOTES[seed % DAILY_QUOTES.length]
}

export function getRecommendation(habits: HabitProgress[], today: string) {
  if (!habits.length) return 'Добавьте одну привычку, которую будет легко поддерживать в повседневной жизни.'
  const metrics = getProgressMetrics(habits, today)
  if (metrics.todayCount === habits.length) {
    return 'План на сегодня выполнен. Завтра можно добавить к одной привычке ещё один небольшой шаг.'
  }
  if (metrics.returningAfterBreak || metrics.missedSeveralDays) {
    return 'Не нужно наверстывать пропущенное. Выберите одну привычку и вернитесь к ней в удобном темпе.'
  }
  if (metrics.weeklyDeclined) {
    return 'За последнюю неделю отметок стало меньше. Попробуйте сегодня выполнить одну самую простую привычку.'
  }

  const lastSevenDays = Array.from({ length: 7 }, (_, index) => shiftDateKey(today, index - 6))
  for (const habit of habits) {
    const age = habit.createdAt ? daysBetween(habit.createdAt, today) + 1 : 0
    if (age < 5) continue
    const eligibleDays = Math.min(7, age)
    const completions = uniqueDates(habit).filter((date) => lastSevenDays.includes(date)).length
    if (completions <= Math.floor(eligibleDays * 0.4)) {
      return `«${habit.name}» пока даётся нерегулярно. Попробуйте уменьшить её до самой простой версии.`
    }
  }

  const steadyHabit = habits.find((habit) => {
    const age = habit.createdAt ? daysBetween(habit.createdAt, today) + 1 : 0
    const recent = uniqueDates(habit).filter((date) => lastSevenDays.includes(date)).length
    return age >= 7 && recent >= 5 && currentStreak(habit, today) >= 3
  })
  if (steadyHabit) return `Вы стабильно заботитесь о привычке «${steadyHabit.name}». Заметьте, как далеко вы продвинулись.`
  if (metrics.todayCount > 0) return 'Вы уже начали. Если появится возможность, добавьте ещё один короткий шаг.'
  return 'Выберите одну привычку, которую можно выполнить за несколько минут, и начните с неё.'
}

export function getEligibleAchievementIds(habits: HabitProgress[], today: string, lastRecordDate: string | null) {
  const unlocked = new Set<string>()
  const metrics = getProgressMetrics(habits, today)
  const allDates = [...new Set(habits.flatMap(uniqueDates))].sort()
  if (metrics.totalCompletions >= 1) unlocked.add('first-completion')
  if (metrics.totalCompletions >= 100) unlocked.add('completion-100')
  const best = metrics.bestStreak
  for (const days of [3, 7, 14, 30]) {
    if (best >= days) unlocked.add(`streak-${days}`)
  }
  if (habits.length > 0 && metrics.todayCount === habits.length) unlocked.add('daily-master')
  if (allDates.some((date, index) => index > 0 && daysBetween(allDates[index - 1], date) >= 4)) {
    unlocked.add('comeback')
  }
  if (lastRecordDate) unlocked.add('personal-record')
  return [...unlocked]
}

export function defaultMotivationState(habits: HabitProgress[]): MotivationState {
  return {
    achievements: {},
    personalBest: highestStreak(habits),
    lastRecordDate: null,
    quoteHistory: [],
    messageHistory: [],
  }
}
