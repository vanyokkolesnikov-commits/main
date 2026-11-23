import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getDailyQuote,
  getEligibleAchievementIds,
  getMotivationMessage,
  getProgressMetrics,
  getRecommendation,
  isNewPersonalRecord,
} from '../src/motivation.ts'

const today = '2026-11-24'
const habit = (id, completions, createdAt = '2026-11-01') => ({ id, name: id, completions, createdAt })

test('progress metrics use actual completion dates and compare equal seven-day windows', () => {
  const habits = [
    habit('walk', [today, '2026-11-23', '2026-11-17']),
    habit('read', ['2026-11-22', '2026-11-16']),
  ]
  const metrics = getProgressMetrics(habits, today)
  assert.equal(metrics.todayCount, 1)
  assert.equal(metrics.todayPercent, 50)
  assert.equal(metrics.recentCount, 3)
  assert.equal(metrics.previousCount, 2)
  assert.equal(metrics.weeklyImproved, true)
})

test('missed days, return after a break, and lost streak are distinguished', () => {
  const missed = getProgressMetrics([habit('walk', ['2026-11-21'])], today)
  assert.equal(missed.missedSeveralDays, true)
  assert.equal(missed.returningAfterBreak, false)
  assert.match(getMotivationMessage([habit('walk', ['2026-11-21'])], today, null, []).title, /вер|нач|сейчас/i)

  const returned = getProgressMetrics([habit('walk', ['2026-11-15', today])], today)
  assert.equal(returned.returningAfterBreak, true)

  const lost = getProgressMetrics([habit('walk', ['2026-11-15', '2026-11-16', '2026-11-17'])], '2026-11-19')
  assert.equal(lost.lostStreak, true)
  assert.equal(lost.missedSeveralDays, false)
})

test('message changes with progress and avoids recently shown variants', () => {
  const before = [habit('walk', [])]
  const after = [habit('walk', [today])]
  const start = getMotivationMessage(before, today, null, [])
  const partial = getMotivationMessage([...after, habit('read', [])], today, null, [])
  assert.notEqual(start.id, partial.id)
  assert.match(partial.title, /начал|двига|ритме|прогресс/i)
})

test('daily quote is stable for the same date and does not repeat the recent quote', () => {
  const quote = getDailyQuote([], today)
  assert.equal(getDailyQuote([{ date: today, id: quote.id }], today).id, quote.id)
  const history = Array.from({ length: 5 }, (_, index) => {
    const date = new Date(Date.UTC(2026, 10, 24 - index))
    return { date: date.toISOString().slice(0, 10), id: `q${String(index + 1).padStart(2, '0')}` }
  })
  const next = getDailyQuote(history, '2026-11-19')
  assert.ok(history.every((item) => item.id !== next.id))
})

test('achievements unlock from recorded streaks, totals, and full-day completion', () => {
  const dates = ['2026-11-22', '2026-11-23', today]
  const ids = getEligibleAchievementIds([habit('walk', dates)], today, today)
  assert.deepEqual(new Set(ids), new Set(['first-completion', 'streak-3', 'daily-master', 'personal-record']))

  const hundred = Array.from({ length: 100 }, (_, index) => {
    const date = new Date(Date.UTC(2026, 0, 1 + index))
    return date.toISOString().slice(0, 10)
  })
  assert.ok(getEligibleAchievementIds([habit('read', hundred)], hundred.at(-1), null).includes('completion-100'))
})

test('a personal record requires a meaningful new high streak', () => {
  assert.equal(isNewPersonalRecord(0, 1), false)
  assert.equal(isNewPersonalRecord(0, 3), true)
  assert.equal(isNewPersonalRecord(3, 4), true)
  assert.equal(isNewPersonalRecord(4, 4), false)
})

test('recommendations distinguish a persistent skip pattern from a steady habit', () => {
  const todayDate = new Date(`${today}T00:00:00Z`)
  const skippedHabit = habit('journal', [], '2026-11-15')
  assert.match(getRecommendation([skippedHabit], today), /уменьшить/i)

  const steadyDates = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(todayDate)
    date.setUTCDate(date.getUTCDate() - index - 1)
    return date.toISOString().slice(0, 10)
  })
  assert.match(getRecommendation([habit('walk', steadyDates, '2026-11-01')], today), /стабильно/i)
})
