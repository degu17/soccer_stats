import { PLAYERS } from '../data/players';
import { useApp } from '../state';
import { PrintPhoto, TopBar } from '../components/ui';

export function Credits() {
  const app = useApp();
  return (
    <div class="screen">
      <TopBar onBack={() => app.go({ name: 'title' })} kicker="CREDITS" title="クレジット" />
      <p class="note credits-lead">
        写真は Wikimedia Commons の自由ライセンス作品をトリミングして使用。成績は Wikipedia の記録にもとづくリーグ戦の数字。
      </p>
      <ul class="credit-list grow">
        {PLAYERS.map((p) => (
          <li key={p.id}>
            <PrintPhoto src={p.photo} w={30} h={34} />
            <span>
              <b>{p.nameJa}</b>
              <small class="mono">
                {p.credit.licenseUrl ? (
                  <a href={p.credit.licenseUrl} target="_blank" rel="noopener">
                    {p.credit.license}
                  </a>
                ) : (
                  p.credit.license
                )}{' '}
                ·{' '}
                <a href={p.credit.source} target="_blank" rel="noopener">
                  出典
                </a>{' '}
                · {p.credit.author}
              </small>
            </span>
          </li>
        ))}
      </ul>
      <p class="credit-foot mono">非公式のファンメイド作品です。各クラブ・リーグ・選手とは関係ありません。</p>
    </div>
  );
}
