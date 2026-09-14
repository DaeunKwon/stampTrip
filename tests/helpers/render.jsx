import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../../src/App'

/** 실제 App 을 메모리 라우터로 띄운다. state 는 location.state (focusSpot, nearby 진입 정보 등) */
export function renderApp({ route = '/', state = null } = {}) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: route, state }]}>
      <App />
    </MemoryRouter>,
  )
}
