import { AppProvider } from './state';
import { InkDefs } from './components/ui';
import { Title } from './screens/Title';
import { HowTo } from './screens/HowTo';
import { Board } from './screens/Board';
import { Case } from './screens/Case';
import { Glossary } from './screens/Glossary';
import { Credits } from './screens/Credits';

export function App() {
  return (
    <AppProvider>
      {({ route }, toast) => (
        <>
          <div class="stage-under" aria-hidden="true" />
          <div class="stage">
            <InkDefs />
            {route.name === 'title' && <Title />}
            {route.name === 'howto' && <HowTo />}
            {route.name === 'board' && <Board />}
            {route.name === 'case' && <Case key={route.id} id={route.id} />}
            {route.name === 'glossary' && <Glossary />}
            {route.name === 'credits' && <Credits />}
            {toast && <div class="toast">{toast}</div>}
          </div>
        </>
      )}
    </AppProvider>
  );
}
