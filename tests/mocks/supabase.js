// supabase-js 페이크: 인메모리 테이블 + 체이닝 쿼리 빌더. src/api/supabase 모듈을 통째로 대체한다.
// 테스트에서 fake.signIn(...) / fake.seed(...) / fake.failNext(...) 로 상태를 조작한다.
import { vi } from 'vitest'

export const TEST_USER_ID = '11111111-1111-4111-8111-111111111111'

const UNIQUE = { stamps: ['user_id', 'content_id'], favorites: ['user_id', 'content_id'] }
const AUTO_TS = { profiles: 'created_at', stamps: 'stamped_at', favorites: 'saved_at', courses: 'created_at' }

function makeState() {
  return {
    session: null,
    initError: null,
    listeners: [],
    tables: { profiles: [], stamps: [], favorites: [], courses: [], trending_daily: [], spot_forecast_daily: [] },
    nextId: 1,
    pendingFailures: [],   // { table, op, error }
    holds: {},             // table → 풀릴 때까지 그 테이블 조회를 붙잡아 두는 Promise (로딩 중 화면 검증용)
    log: [],               // { table, op, payload }
  }
}

let state = makeState()

function checkConstraints(table, row) {
  if (table === 'profiles') {
    const len = String(row.nickname ?? '').length
    if (len < 2 || len > 12) return { code: '23514', message: 'profiles_nickname_check' }
    if (state.tables.profiles.some(r => r.id === row.id)) return { code: '23505', message: 'duplicate key profiles_pkey' }
  }
  if (table === 'courses') {
    const len = String(row.name ?? '').length
    if (len < 1 || len > 30) return { code: '23514', message: 'courses_name_check' }
  }
  const uniq = UNIQUE[table]
  if (uniq && state.tables[table].some(r => uniq.every(k => r[k] === row[k]))) {
    return { code: '23505', message: `duplicate key value violates unique constraint "${table}_${uniq.join('_')}_key"` }
  }
  return null
}

function takeFailure(table, op) {
  const i = state.pendingFailures.findIndex(f => f.table === table && (!f.op || f.op === op))
  if (i < 0) return null
  return state.pendingFailures.splice(i, 1)[0].error
}

class Builder {
  constructor(table) {
    this.table = table
    this.op = 'select'
    this.payload = null
    this.filters = []
    this.orders = []
    this.limitN = null
    this.rangeFT = null
    this.mode = 'many'
    this.returning = false
  }
  select(cols) { if (this.op === 'select') this.cols = cols; else this.returning = true; return this }
  insert(rows) { this.op = 'insert'; this.payload = Array.isArray(rows) ? rows : [rows]; return this }
  upsert(rows) { this.op = 'upsert'; this.payload = Array.isArray(rows) ? rows : [rows]; return this }
  update(patch) { this.op = 'update'; this.payload = patch; return this }
  delete() { this.op = 'delete'; return this }
  eq(k, v) { this.filters.push(r => r[k] === v); return this }
  neq(k, v) { this.filters.push(r => r[k] !== v); return this }
  gte(k, v) { this.filters.push(r => r[k] >= v); return this }
  lt(k, v) { this.filters.push(r => r[k] < v); return this }
  order(k, { ascending = true } = {}) { this.orders.push({ k, ascending }); return this }
  limit(n) { this.limitN = n; return this }
  range(f, t) { this.rangeFT = [f, t]; return this }
  single() { this.mode = 'single'; return this }
  maybeSingle() { this.mode = 'maybeSingle'; return this }

  _matching() {
    return state.tables[this.table].filter(r => this.filters.every(f => f(r)))
  }
  _run() {
    const rows = state.tables[this.table]
    if (!rows) return { data: null, error: { code: '42P01', message: `relation "${this.table}" does not exist` } }
    state.log.push({ table: this.table, op: this.op, payload: this.payload })
    const forced = takeFailure(this.table, this.op)
    if (forced) return { data: null, error: forced }

    let out
    if (this.op === 'select') {
      out = this._matching()
      for (const { k, ascending } of [...this.orders].reverse()) {
        out = [...out].sort((a, b) => (a[k] < b[k] ? -1 : a[k] > b[k] ? 1 : 0) * (ascending ? 1 : -1))
      }
      if (this.rangeFT) out = out.slice(this.rangeFT[0], this.rangeFT[1] + 1)
      if (this.limitN != null) out = out.slice(0, this.limitN)
    } else if (this.op === 'insert' || this.op === 'upsert') {
      out = []
      for (const raw of this.payload) {
        const row = { ...raw }
        if (!('id' in row) && this.table !== 'profiles') row.id = state.nextId++
        if (AUTO_TS[this.table] && !row[AUTO_TS[this.table]]) row[AUTO_TS[this.table]] = new Date().toISOString()
        const err = this.op === 'insert' ? checkConstraints(this.table, row) : null
        if (err) return { data: null, error: err }
        rows.push(row)
        out.push(row)
      }
    } else if (this.op === 'update') {
      out = this._matching().map(r => Object.assign(r, this.payload))
    } else if (this.op === 'delete') {
      const victims = this._matching()
      state.tables[this.table] = rows.filter(r => !victims.includes(r))
      out = victims
    }

    if (this.mode === 'single') {
      if (out.length !== 1) return { data: null, error: { code: 'PGRST116', message: `${out.length} rows` } }
      return { data: out[0], error: null }
    }
    if (this.mode === 'maybeSingle') return { data: out[0] ?? null, error: null }
    if (this.op !== 'select' && !this.returning) return { data: null, error: null }
    return { data: out, error: null }
  }
  then(resolve, reject) {
    return Promise.resolve(state.holds[this.table]).then(() => this._run()).then(resolve, reject)
  }
}

function emit(event, session) {
  state.listeners.forEach(cb => cb(event, session))
}

const auth = {
  initialize: vi.fn(async () => ({ error: state.initError ? { message: state.initError } : null })),
  getSession: vi.fn(async () => ({ data: { session: state.session }, error: null })),
  onAuthStateChange: vi.fn(cb => {
    state.listeners.push(cb)
    return { data: { subscription: { unsubscribe: () => { state.listeners = state.listeners.filter(l => l !== cb) } } } }
  }),
  signInWithOAuth: vi.fn(async () => ({ data: { provider: 'kakao', url: 'https://auth.example/oauth' }, error: null })),
  signOut: vi.fn(async () => { state.session = null; emit('SIGNED_OUT', null); return { error: null } }),
}

const client = {
  auth,
  from: table => new Builder(table),
  rpc: vi.fn(async name => {
    state.log.push({ table: 'rpc', op: name })
    const forced = takeFailure('rpc', name)
    if (forced) return { data: null, error: forced }
    if (name === 'delete_my_account') {
      const uid = state.session?.user?.id
      for (const t of ['profiles', 'stamps', 'favorites', 'courses']) {
        state.tables[t] = state.tables[t].filter(r => (t === 'profiles' ? r.id : r.user_id) !== uid)
      }
      return { data: null, error: null }
    }
    return { data: null, error: { message: `unknown rpc ${name}` } }
  }),
}

export function makeUser({ id = TEST_USER_ID, provider = 'kakao', email = 'tester@example.com', name = '테스터', avatar = null } = {}) {
  return {
    id, email,
    app_metadata: { provider },
    user_metadata: provider === 'kakao' ? { name, avatar_url: avatar, email } : { full_name: name, picture: avatar, email },
    created_at: '2026-08-01T00:00:00.000Z',
  }
}

export const fake = {
  client,
  get state() { return state },
  reset() {
    state = makeState()
    auth.initialize.mockClear(); auth.getSession.mockClear(); auth.signInWithOAuth.mockClear(); auth.signOut.mockClear()
    client.rpc.mockClear()
  },
  /** 로그인 상태로 시작. profile 을 주면 profiles 행도 만든다 */
  signIn({ user = makeUser(), profile = { nickname: '테스터' } } = {}) {
    state.session = { access_token: 'fake-token', user }
    if (profile) state.tables.profiles.push({ id: user.id, nickname: profile.nickname, avatar_url: profile.avatar_url ?? null, created_at: '2026-08-01T00:00:00.000Z' })
    return user
  },
  seed(table, rows) {
    for (const r of rows) state.tables[table].push({ id: state.nextId++, ...r })
  },
  failNext(table, error, op) { state.pendingFailures.push({ table, op, error }) },
  /** 이 테이블의 응답을 붙잡아 둔다. 돌려준 함수를 부르면 풀린다 */
  hold(table) {
    let release
    state.holds[table] = new Promise(r => { release = r })
    return () => { delete state.holds[table]; release() }
  },
  setInitError(msg) { state.initError = msg },
  rows(table) { return state.tables[table] },
  log() { return state.log },
}

export const supabase = client
export const isSupabaseConfigured = true
